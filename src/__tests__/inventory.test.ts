import { addStock, removeStock, stockOpname, exchangeItems } from '../services/inventoryService';
import * as inventoryModel from '../models/inventoryModel';
import * as productModel from '../models/productModel';
import * as journalService from '../services/journalService';
import * as accountModel from '../models/accountModel';
import pool from '../config/db';

jest.mock('../models/inventoryModel');
jest.mock('../models/productModel');
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

describe('Inventory Service', () => {
  let mClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mClient = await pool.connect();
    (inventoryModel.getProductStock as jest.Mock).mockResolvedValue(10);
    (accountModel.findByCodeAndOutletId as jest.Mock).mockImplementation(async (code) => {
      if (code === '1000') return { id: 'acc_kas' };
      if (code === '1200') return { id: 'acc_inventory' };
      if (code === '4000') return { id: 'acc_revenue' };
      if (code === '4100') return { id: 'acc_revenue' };
      if (code === '5000') return { id: 'acc_hpp' };
      if (code === '6100') return { id: 'acc_expense' };
      return null;
    });
  });

  describe('addStock', () => {
    it('should create batch and transaction, then update stock', async () => {
      await addStock('outlet1', 'prod1', 5, 10000, 'PURCHASE', 'INV-001', 'Test');
      
      expect(inventoryModel.createBatch).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 5, unit_cost: 10000 }),
        mClient
      );
      expect(inventoryModel.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'IN', quantity: 5, total_cost: 50000 }),
        mClient
      );
      expect(inventoryModel.updateProductStock).toHaveBeenCalledWith('prod1', 'outlet1', 15, mClient); // 10 + 5
      expect(mClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('removeStock (FIFO)', () => {
    it('should deduct from oldest batches and return total cost', async () => {
      (inventoryModel.getAvailableBatchesByProductId as jest.Mock).mockResolvedValue([
        { id: 'b1', quantity_available: 5, unit_cost: 10000 },
        { id: 'b2', quantity_available: 10, unit_cost: 12000 }
      ]);
      (inventoryModel.getProductStock as jest.Mock).mockResolvedValue(15);

      const totalCost = await removeStock('outlet1', 'prod1', 8, 'SALE', 'INV-002');

      // Deducts 5 from b1 (5 * 10k = 50k), 3 from b2 (3 * 12k = 36k). Total = 86k.
      expect(totalCost).toBe(86000);
      expect(inventoryModel.updateBatchQuantity).toHaveBeenCalledWith('b1', 0, mClient);
      expect(inventoryModel.updateBatchQuantity).toHaveBeenCalledWith('b2', 7, mClient);
      expect(inventoryModel.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'OUT', quantity: 8, total_cost: 86000 }),
        mClient
      );
      expect(inventoryModel.updateProductStock).toHaveBeenCalledWith('prod1', 'outlet1', 7, mClient); // 15 - 8
    });

    it('should throw error if insufficient stock', async () => {
      (inventoryModel.getProductStock as jest.Mock).mockResolvedValue(5); // Only 5 in products table
      
      await expect(removeStock('outlet1', 'prod1', 10)).rejects.toThrow('Insufficient stock');
      expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('stockOpname', () => {
    it('should handle surplus (add stock and create journal)', async () => {
      (inventoryModel.getProductStock as jest.Mock).mockResolvedValue(10);
      (inventoryModel.getBatchesByProductId as jest.Mock).mockResolvedValue([
        { unit_cost: 15000 } // Use last cost
      ]);

      const res = await stockOpname('outlet1', 'prod1', 12, 'Found extra');
      
      expect(res.message).toContain('Surplus adjusted: +2');
      
      expect(inventoryModel.createBatch).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 2, unit_cost: 15000 }),
        expect.any(Object)
      );

      expect(journalService.createJournal).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Stock Opname Surplus: Product prod1',
          items: [
            { account_id: 'acc_inventory', debit: 30000, credit: 0, description: 'Penyesuaian stok lebih' }, // 2 * 15k
            { account_id: 'acc_revenue', debit: 0, credit: 30000, description: 'Pendapatan penyesuaian stok' }
          ]
        })
      );
    });

    it('should handle deficit (remove stock and create journal)', async () => {
      (inventoryModel.getProductStock as jest.Mock).mockResolvedValue(10);
      (inventoryModel.getAvailableBatchesByProductId as jest.Mock).mockResolvedValue([
        { id: 'b1', quantity_available: 10, unit_cost: 15000 }
      ]);

      const res = await stockOpname('outlet1', 'prod1', 7, 'Lost items');
      
      expect(res.message).toContain('Deficit adjusted: -3');
      
      expect(inventoryModel.updateBatchQuantity).toHaveBeenCalledWith('b1', 7, expect.any(Object));

      expect(journalService.createJournal).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Stock Opname Deficit: Product prod1',
          items: [
            { account_id: 'acc_expense', debit: 45000, credit: 0, description: 'Kerugian penyesuaian stok' }, // 3 * 15k
            { account_id: 'acc_inventory', debit: 0, credit: 45000, description: 'Penyesuaian stok kurang' }
          ]
        })
      );
    });

    it('should do nothing if physically balanced', async () => {
      (inventoryModel.getProductStock as jest.Mock).mockResolvedValue(10);
      const res = await stockOpname('outlet1', 'prod1', 10, 'Balanced');
      
      expect(res.message).toContain('Stock is already balanced');
      expect(inventoryModel.createBatch).not.toHaveBeenCalled();
      expect(journalService.createJournal).not.toHaveBeenCalled();
    });
  });

  describe('exchangeItems', () => {
    it('should exchange items, update stocks and record journal if price constraint is met', async () => {
      // Mock returned product (cheaper)
      const returnedProduct = { id: 'p_returned', name: 'Product Return', price: 10000, cost_price: 6000 };
      // Mock exchange product (more expensive)
      const exchangeProduct = { id: 'p_exchange', name: 'Product Exchange', price: 15000, cost_price: 9000 };

      (productModel.findById as jest.Mock).mockImplementation(async (id) => {
        if (id === 'p_returned') return returnedProduct;
        if (id === 'p_exchange') return exchangeProduct;
        return null;
      });

      // Stock of exchange product is available
      (inventoryModel.getProductStock as jest.Mock).mockImplementation(async (id) => {
        if (id === 'p_exchange') return 10;
        if (id === 'p_returned') return 5;
        return 0;
      });

      // FIFO batches for exchange product
      (inventoryModel.getAvailableBatchesByProductId as jest.Mock).mockResolvedValue([
        { id: 'b_exchange_1', quantity_available: 5, unit_cost: 9000 }
      ]);
      // Batches for returned product to get latest cost
      (inventoryModel.getBatchesByProductId as jest.Mock).mockResolvedValue([
        { id: 'b_returned_1', quantity_available: 5, unit_cost: 6000 }
      ]);

      const result = await exchangeItems('outlet1', {
        returned_product_id: 'p_returned',
        returned_quantity: 1,
        exchange_product_id: 'p_exchange',
        exchange_quantity: 1,
        payment_account_id: 'acc_kas'
      });

      expect(result.success).toBe(true);
      expect(result.difference).toBe(5000); // 15000 - 10000

      // Returned product added to stock
      expect(inventoryModel.createBatch).toHaveBeenCalledWith(
        expect.objectContaining({ product_id: 'p_returned', quantity: 1, unit_cost: 6000 }),
        expect.any(Object)
      );

      // Exchange product deducted from stock
      expect(inventoryModel.updateBatchQuantity).toHaveBeenCalledWith('b_exchange_1', 4, expect.any(Object)); // 5 - 1

      // Journal entry recorded
      expect(journalService.createJournal).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Transaksi Penukaran Barang'),
          items: expect.arrayContaining([
            { account_id: 'acc_revenue', debit: 10000, credit: 0, description: 'Retur Penukaran: Product Return' },
            { account_id: 'acc_revenue', debit: 0, credit: 15000, description: 'Penukaran Keluar: Product Exchange' },
            { account_id: 'acc_inventory', debit: 6000, credit: 0, description: 'Kembali ke Persediaan: Product Return' },
            { account_id: 'acc_hpp', debit: 0, credit: 6000, description: 'Reversal HPP Retur: Product Return' },
            { account_id: 'acc_hpp', debit: 9000, credit: 0, description: 'HPP Penukaran: Product Exchange' },
            { account_id: 'acc_inventory', debit: 0, credit: 9000, description: 'Persediaan Keluar: Product Exchange' },
            { account_id: 'acc_kas', debit: 5000, credit: 0, description: 'Penerimaan Selisih Penukaran' }
          ])
        })
      );
    });

    it('should throw error if returned product is more expensive or equal to exchange product', async () => {
      const returnedProduct = { id: 'p_returned', name: 'Product Return', price: 20000, cost_price: 12000 };
      const exchangeProduct = { id: 'p_exchange', name: 'Product Exchange', price: 15000, cost_price: 9000 };

      (productModel.findById as jest.Mock).mockImplementation(async (id) => {
        if (id === 'p_returned') return returnedProduct;
        if (id === 'p_exchange') return exchangeProduct;
        return null;
      });

      await expect(exchangeItems('outlet1', {
        returned_product_id: 'p_returned',
        returned_quantity: 1,
        exchange_product_id: 'p_exchange',
        exchange_quantity: 1
      })).rejects.toThrow('Harga barang yang dikembalikan harus lebih murah');
    });
    
    it('should throw error if exchange product stock is insufficient', async () => {
      const returnedProduct = { id: 'p_returned', name: 'Product Return', price: 10000, cost_price: 6000 };
      const exchangeProduct = { id: 'p_exchange', name: 'Product Exchange', price: 15000, cost_price: 9000 };

      (productModel.findById as jest.Mock).mockImplementation(async (id) => {
        if (id === 'p_returned') return returnedProduct;
        if (id === 'p_exchange') return exchangeProduct;
        return null;
      });

      (inventoryModel.getProductStock as jest.Mock).mockImplementation(async (id) => {
        if (id === 'p_exchange') return 0; // Insufficient stock
        return 5;
      });

      await expect(exchangeItems('outlet1', {
        returned_product_id: 'p_returned',
        returned_quantity: 1,
        exchange_product_id: 'p_exchange',
        exchange_quantity: 1
      })).rejects.toThrow('Insufficient stock');
    });
  });

  describe('Negative edge cases and error handling', () => {
    it('addStock should handle database errors and rollback', async () => {
      (inventoryModel.createBatch as jest.Mock).mockRejectedValue(new Error('Simulated DB connection lost'));
      
      await expect(addStock('outlet1', 'prod1', 5, 10000, 'PURCHASE')).rejects.toThrow('Simulated DB connection lost');
      expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('removeStock should handle database errors and rollback', async () => {
      (inventoryModel.getProductStock as jest.Mock).mockResolvedValue(10);
      (inventoryModel.getAvailableBatchesByProductId as jest.Mock).mockRejectedValue(new Error('Simulated DB error'));
      
      await expect(removeStock('outlet1', 'prod1', 5)).rejects.toThrow('Simulated DB error');
      expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('stockOpname should handle database errors and bubble up', async () => {
      (inventoryModel.getProductStock as jest.Mock).mockRejectedValue(new Error('DB failure during opname'));
      
      await expect(stockOpname('outlet1', 'prod1', 12, 'Found extra')).rejects.toThrow('DB failure during opname');
    });
  });
});
