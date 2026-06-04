import { createPurchase, receiveGoods, deletePurchase, getPurchaseById } from '../services/purchaseService';
import * as purchaseModel from '../models/purchaseModel';
import * as inventoryService from '../services/inventoryService';
import * as journalService from '../services/journalService';
import * as accountModel from '../models/accountModel';
import pool from '../config/db';

jest.mock('../models/purchaseModel');
jest.mock('../services/inventoryService');
jest.mock('../services/journalService');
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

describe('Purchase Service', () => {
  let mClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mClient = await pool.connect();
    (accountModel.findByCodeAndOutletId as jest.Mock).mockImplementation(async (code) => {
      if (code === '1000') return { id: 'acc_kas' };
      if (code === '1200') return { id: 'acc_inventory' };
      if (code === '2000') return { id: 'acc_payable' };
      return null;
    });
  });

  describe('createPurchase', () => {
    it('should generate PO number and save purchase details', async () => {
      const input = {
        vendor_id: 'v_id',
        date: '2026-06-04T12:00:00Z',
        payment_method: 'CASH' as const,
        items: [
          { product_id: 'p1', quantity_ordered: 10, unit_cost: 15000 },
          { product_id: 'p2', quantity_ordered: 5, unit_cost: 20000 }
        ]
      };

      (purchaseModel.create as jest.Mock).mockResolvedValue({ id: 'po_1', total_amount: 250000 });

      const res = await createPurchase('outlet1', input);

      expect(purchaseModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          outlet_id: 'outlet1',
          vendor_id: 'v_id',
          payment_method: 'CASH',
          total_amount: 250000 // (10 * 15k) + (5 * 20k)
        }),
        expect.arrayContaining([
          { product_id: 'p1', quantity_ordered: 10, unit_cost: 15000 },
          { product_id: 'p2', quantity_ordered: 5, unit_cost: 20000 }
        ]),
        mClient
      );
      expect(res).toBeDefined();
    });
  });

  describe('receiveGoods', () => {
    it('should partially receive goods, update stock, and log to journal', async () => {
      const mockPurchase = {
        id: 'po_1',
        po_number: 'PO-20260604-0001',
        status: 'OTW',
        payment_method: 'HUTANG',
        vendor_id: 'v_id',
        total_amount: 150000
      };

      const mockItems = [
        { id: 'pi_1', purchase_id: 'po_1', product_id: 'p1', product_name: 'Product 1', quantity_ordered: 10, quantity_received: 0, unit_cost: 15000 }
      ];

      (purchaseModel.findById as jest.Mock).mockResolvedValue(mockPurchase);
      (purchaseModel.findItemsByPurchaseId as jest.Mock)
        .mockResolvedValueOnce(mockItems) // first fetch
        .mockResolvedValueOnce([
          { id: 'pi_1', purchase_id: 'po_1', product_id: 'p1', quantity_ordered: 10, quantity_received: 5, unit_cost: 15000 } // second check (not fully completed)
        ]);

      const res = await receiveGoods('outlet1', 'po_1', [
        { product_id: 'p1', quantity_received: 5 }
      ]);

      expect(res.success).toBe(true);
      expect(res.fully_received).toBe(false);

      // Check database update for item received quantity
      expect(purchaseModel.updateItemReceivedQuantity).toHaveBeenCalledWith('pi_1', 5, mClient);

      // Check stock add
      expect(inventoryService.addStock).toHaveBeenCalledWith(
        'outlet1',
        'p1',
        5,
        15000,
        'PURCHASE',
        'PO-20260604-0001',
        expect.any(String),
        mClient
      );

      // Check vendor payable balance increase
      expect(purchaseModel.updateVendorPayableBalance).toHaveBeenCalledWith('v_id', 'outlet1', 75000, mClient);

      // Check journal log
      expect(journalService.createJournal).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Penerimaan Barang PO'),
          items: expect.arrayContaining([
            { account_id: 'acc_inventory', debit: 75000, credit: 0, description: expect.any(String) },
            { account_id: 'acc_payable', debit: 0, credit: 75000, description: expect.any(String) }
          ])
        }),
        mClient
      );

      // Status should NOT be completed
      expect(purchaseModel.updateStatus).not.toHaveBeenCalled();
    });

    it('should update status to COMPLETED if fully received', async () => {
      const mockPurchase = {
        id: 'po_2',
        po_number: 'PO-20260604-0002',
        status: 'OTW',
        payment_method: 'CASH',
        vendor_id: 'v_id',
        total_amount: 150000
      };

      const mockItems = [
        { id: 'pi_2', purchase_id: 'po_2', product_id: 'p1', product_name: 'Product 1', quantity_ordered: 10, quantity_received: 5, unit_cost: 15000 }
      ];

      (purchaseModel.findById as jest.Mock).mockResolvedValue(mockPurchase);
      (purchaseModel.findItemsByPurchaseId as jest.Mock)
        .mockResolvedValueOnce(mockItems) // first fetch
        .mockResolvedValueOnce([
          { id: 'pi_2', purchase_id: 'po_2', product_id: 'p1', quantity_ordered: 10, quantity_received: 10, unit_cost: 15000 } // second check (fully completed)
        ]);

      const res = await receiveGoods('outlet1', 'po_2', [
        { product_id: 'p1', quantity_received: 5 }
      ]);

      expect(res.success).toBe(true);
      expect(res.fully_received).toBe(true);
      expect(purchaseModel.updateStatus).toHaveBeenCalledWith('po_2', 'outlet1', 'COMPLETED', mClient);
    });

    it('should throw error if received quantity exceeds ordered', async () => {
      const mockPurchase = {
        id: 'po_3',
        po_number: 'PO-20260604-0003',
        status: 'OTW',
        payment_method: 'CASH',
        vendor_id: 'v_id',
        total_amount: 150000
      };

      const mockItems = [
        { id: 'pi_3', purchase_id: 'po_3', product_id: 'p1', product_name: 'Product 1', quantity_ordered: 10, quantity_received: 8, unit_cost: 15000 }
      ];

      (purchaseModel.findById as jest.Mock).mockResolvedValue(mockPurchase);
      (purchaseModel.findItemsByPurchaseId as jest.Mock).mockResolvedValue(mockItems);

      await expect(receiveGoods('outlet1', 'po_3', [
        { product_id: 'p1', quantity_received: 5 } // 8 + 5 = 13 > 10
      ])).rejects.toThrow('Received quantity exceeds ordered quantity');
    });
  });

  describe('deletePurchase', () => {
    it('should delete PO if status is OTW and zero items received', async () => {
      const mockPurchase = {
        id: 'po_4',
        status: 'OTW'
      };

      const mockItems = [
        { id: 'pi_4', quantity_ordered: 10, quantity_received: 0 }
      ];

      (purchaseModel.findById as jest.Mock).mockResolvedValue(mockPurchase);
      (purchaseModel.findItemsByPurchaseId as jest.Mock).mockResolvedValue(mockItems);
      (purchaseModel.remove as jest.Mock).mockResolvedValue(true);

      const success = await deletePurchase('outlet1', 'po_4');
      expect(success).toBe(true);
      expect(purchaseModel.remove).toHaveBeenCalledWith('po_4', 'outlet1', mClient);
    });

    it('should fail to delete if any items are already received', async () => {
      const mockPurchase = {
        id: 'po_5',
        status: 'OTW'
      };

      const mockItems = [
        { id: 'pi_5', quantity_ordered: 10, quantity_received: 2 }
      ];

      (purchaseModel.findById as jest.Mock).mockResolvedValue(mockPurchase);
      (purchaseModel.findItemsByPurchaseId as jest.Mock).mockResolvedValue(mockItems);

      await expect(deletePurchase('outlet1', 'po_5')).rejects.toThrow('Cannot delete Purchase Order because some items have already been received');
    });

    it('should throw error if PO is already completed or cancelled', async () => {
      (purchaseModel.findById as jest.Mock).mockResolvedValue({ id: 'po_5', status: 'COMPLETED' });
      await expect(deletePurchase('outlet1', 'po_5')).rejects.toThrow('Only OTW Purchase Orders can be deleted');
    });
  });

  describe('Negative edge cases', () => {
    it('createPurchase should handle database error and rollback', async () => {
      (purchaseModel.create as jest.Mock).mockRejectedValue(new Error('Simulated DB error'));
      const input = {
        vendor_id: 'v_id',
        date: '2026-06-04T12:00:00Z',
        payment_method: 'CASH' as const,
        items: [{ product_id: 'p1', quantity_ordered: 10, unit_cost: 15000 }]
      };

      await expect(createPurchase('outlet1', input)).rejects.toThrow('Simulated DB error');
      expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('receiveGoods should throw error if item not found in PO', async () => {
      (purchaseModel.findById as jest.Mock).mockResolvedValue({ id: 'po_1', status: 'OTW' });
      (purchaseModel.findItemsByPurchaseId as jest.Mock).mockResolvedValue([{ id: 'pi_1', product_id: 'p1', quantity_ordered: 10 }]);

      await expect(receiveGoods('outlet1', 'po_1', [
        { product_id: 'invalid_p', quantity_received: 5 }
      ])).rejects.toThrow('Product invalid_p is not part of this Purchase Order');
    });
  });
});
