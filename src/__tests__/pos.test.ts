import { processSale } from '../services/posService';
import * as posModel from '../models/posModel';
import * as inventoryService from '../services/inventoryService';
import * as journalService from '../services/journalService';
import * as customerModel from '../models/customerModel';
import * as voucherModel from '../models/voucherModel';
import pool from '../config/db';
import { findByCodeAndOutletId } from '../models/accountModel';

jest.mock('../models/posModel');
jest.mock('../services/inventoryService');
jest.mock('../services/journalService');
jest.mock('../models/customerModel');
jest.mock('../models/voucherModel');
jest.mock('../models/accountModel');
jest.mock('../config/db', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    connect: jest.fn(() => mClient),
  };
});

describe('POS Service Integration', () => {
  let mClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mClient = await pool.connect();

    (posModel.generateInvoiceNumber as jest.Mock).mockResolvedValue('INV-20260604-001');
    (posModel.createSale as jest.Mock).mockResolvedValue({ id: 'sale1' });
    (inventoryService.removeStock as jest.Mock).mockResolvedValue(50000); // Mock HPP per item = 50k

    (findByCodeAndOutletId as jest.Mock).mockImplementation(async (code) => {
      if (code === '1000') return { id: 'acc_kas' };
      if (code === '1100') return { id: 'acc_piutang' };
      if (code === '1200') return { id: 'acc_inventory' };
      if (code === '4000') return { id: 'acc_revenue' };
      if (code === '4200') return { id: 'acc_discount' };
      if (code === '5000') return { id: 'acc_hpp' };
      return null;
    });
  });

  it('should process cash sale without voucher successfully', async () => {
    const input = {
      items: [
        { product_id: 'prod1', quantity: 2, unit_price: 100000 } // Subtotal 200k
      ],
      payment_method: 'CASH',
      paid_amount: 200000
    };

    await processSale('outlet1', input);

    // Should create sale with correct totals
    expect(posModel.createSale).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 200000,
        discount_amount: 0,
        grand_total: 200000,
        paid_amount: 200000,
        change_amount: 0,
        status: 'COMPLETED'
      }),
      mClient
    );

    // Should remove stock for 2 items, HPP returned was 50000 (total_cost mocked above)
    expect(inventoryService.removeStock).toHaveBeenCalledWith(
      'outlet1', 'prod1', 2, 'SALE', 'INV-20260604-001', expect.any(String)
    );

    // Should create journal
    expect(journalService.createJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          { account_id: 'acc_revenue', debit: 0, credit: 200000, description: expect.any(String) },
          { account_id: 'acc_kas', debit: 200000, credit: 0, description: expect.any(String) },
          { account_id: 'acc_hpp', debit: 50000, credit: 0, description: expect.any(String) },
          { account_id: 'acc_inventory', debit: 0, credit: 50000, description: expect.any(String) }
        ])
      })
    );
  });

  it('should process piutang sale with voucher correctly', async () => {
    (voucherModel.findByIdAndOutletId as jest.Mock).mockResolvedValue({
      id: 'v1',
      discount_type: 'PERCENTAGE',
      discount_value: 10, // 10% discount
      is_used: false
    });

    (customerModel.findByIdAndOutletId as jest.Mock).mockResolvedValue({
      id: 'cust1',
      receivable_balance: 0
    });

    const input = {
      customer_id: 'cust1',
      voucher_id: 'v1',
      items: [
        { product_id: 'prod1', quantity: 1, unit_price: 100000 } // Subtotal 100k
      ],
      payment_method: 'PIUTANG',
      paid_amount: 20000 // DP 20k, Piutang 70k
    };

    await processSale('outlet1', input);

    // Verify sale totals
    // Subtotal = 100k
    // Discount = 10% = 10k
    // Grand Total = 90k
    // Paid = 20k -> Piutang = 70k
    expect(posModel.createSale).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 100000,
        discount_amount: 10000,
        grand_total: 90000,
        paid_amount: 20000,
        status: 'PIUTANG'
      }),
      mClient
    );

    // Verify voucher is marked as used
    expect(mClient.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE vouchers SET is_used = true'),
      ['v1']
    );

    // Verify customer receivable balance updated
    expect(customerModel.updateCustomer).toHaveBeenCalledWith(
      'cust1', 'outlet1', { receivable_balance: 70000 }, mClient
    );

    // Verify Journal has Discount and partial payments
    expect(journalService.createJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          { account_id: 'acc_revenue', debit: 0, credit: 100000, description: expect.any(String) },
          { account_id: 'acc_discount', debit: 10000, credit: 0, description: expect.any(String) },
          { account_id: 'acc_kas', debit: 20000, credit: 0, description: expect.any(String) },
          { account_id: 'acc_piutang', debit: 70000, credit: 0, description: expect.any(String) }
        ])
      })
    );
  });

  describe('Negative edge cases', () => {
    it('should throw error if items array is empty', async () => {
      const input = { items: [], payment_method: 'CASH', paid_amount: 100000 };
      await expect(processSale('outlet1', input as any)).rejects.toThrow('No items provided for sale');
    });

    it('should throw error if paid amount is insufficient for CASH sale', async () => {
      const input = {
        items: [{ product_id: 'prod1', quantity: 1, unit_price: 100000 }],
        payment_method: 'CASH',
        paid_amount: 50000 // Only 50k for 100k grand total
      };

      await expect(processSale('outlet1', input as any)).rejects.toThrow('Paid amount is less than grand total');
    });

    it('should throw error for used or invalid voucher', async () => {
      (voucherModel.findByIdAndOutletId as jest.Mock).mockResolvedValue({
        id: 'v1',
        is_used: true // Already used
      });

      const input = {
        voucher_id: 'v1',
        items: [{ product_id: 'prod1', quantity: 1, unit_price: 100000 }],
        payment_method: 'CASH',
        paid_amount: 100000
      };

      await expect(processSale('outlet1', input as any)).rejects.toThrow('Voucher has already been used');
    });

    it('should rollback transaction if stock is insufficient', async () => {
      (inventoryService.removeStock as jest.Mock).mockRejectedValue(new Error('Insufficient stock'));

      const input = {
        items: [{ product_id: 'prod1', quantity: 5, unit_price: 100000 }],
        payment_method: 'CASH',
        paid_amount: 500000
      };

      await expect(processSale('outlet1', input as any)).rejects.toThrow('Insufficient stock');
      expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
