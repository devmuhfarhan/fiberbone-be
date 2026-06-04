import { createTransfer, createExpense, createIncome, createPayable } from '../services/transactionService';
import * as journalService from '../services/journalService';

jest.mock('../services/journalService');
jest.mock('../utils/logger');

const mockCreateJournal = journalService.createJournal as jest.Mock;

describe('Transaction Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create transfer transaction correctly', async () => {
    mockCreateJournal.mockResolvedValue({ id: 'j1' });
    await createTransfer('outlet1', 'acc1', 'acc2', 1000, '2023-01-01', 'Transfer test', 'TRX-001');
    
    expect(mockCreateJournal).toHaveBeenCalledWith({
      outlet_id: 'outlet1',
      journal_number: 'TRX-001',
      date: '2023-01-01',
      description: 'Transfer: Transfer test',
      items: [
        { account_id: 'acc2', debit: 1000, credit: 0, description: 'Penerimaan transfer' },
        { account_id: 'acc1', debit: 0, credit: 1000, description: 'Pengiriman transfer' }
      ]
    });
  });

  it('should create expense transaction correctly', async () => {
    mockCreateJournal.mockResolvedValue({ id: 'j2' });
    await createExpense('outlet1', 'expense1', 'payment1', 500, '2023-01-01', 'Beli token', 'TRX-002');

    expect(mockCreateJournal).toHaveBeenCalledWith({
      outlet_id: 'outlet1',
      journal_number: 'TRX-002',
      date: '2023-01-01',
      description: 'Pengeluaran: Beli token',
      items: [
        { account_id: 'expense1', debit: 500, credit: 0, description: 'Biaya pengeluaran' },
        { account_id: 'payment1', debit: 0, credit: 500, description: 'Pembayaran biaya' }
      ]
    });
  });

  it('should create income transaction correctly', async () => {
    mockCreateJournal.mockResolvedValue({ id: 'j3' });
    await createIncome('outlet1', 'income1', 'deposit1', 2000, '2023-01-01', 'Jasa service', 'TRX-003');

    expect(mockCreateJournal).toHaveBeenCalledWith({
      outlet_id: 'outlet1',
      journal_number: 'TRX-003',
      date: '2023-01-01',
      description: 'Pemasukan: Jasa service',
      items: [
        { account_id: 'deposit1', debit: 2000, credit: 0, description: 'Penerimaan dana' },
        { account_id: 'income1', debit: 0, credit: 2000, description: 'Pendapatan' }
      ]
    });
  });

  it('should create payable transaction correctly', async () => {
    mockCreateJournal.mockResolvedValue({ id: 'j4' });
    await createPayable('outlet1', 'payable1', 'target1', 1500, '2023-01-01', 'Beli barang ngutang', 'TRX-004', 'vendor1');

    expect(mockCreateJournal).toHaveBeenCalledWith({
      outlet_id: 'outlet1',
      journal_number: 'TRX-004',
      date: '2023-01-01',
      description: 'Hutang Usaha: Beli barang ngutang',
      reference: 'VENDOR_ID:vendor1',
      items: [
        { account_id: 'target1', debit: 1500, credit: 0, description: 'Penambahan persediaan/biaya dari hutang' },
        { account_id: 'payable1', debit: 0, credit: 1500, description: 'Pencatatan hutang usaha' }
      ]
    });
  });

  describe('Negative edge cases', () => {
    it('should throw error and log if createTransfer fails', async () => {
      mockCreateJournal.mockRejectedValue(new Error('Journal error'));
      await expect(createTransfer('outlet1', 'acc1', 'acc2', 1000, '2023-01-01', 'Transfer test', 'TRX-001'))
        .rejects.toThrow('Journal error');
    });

    it('should throw error and log if createExpense fails', async () => {
      mockCreateJournal.mockRejectedValue(new Error('Journal error'));
      await expect(createExpense('outlet1', 'expense1', 'payment1', 500, '2023-01-01', 'Beli token', 'TRX-002'))
        .rejects.toThrow('Journal error');
    });

    it('should throw error and log if createIncome fails', async () => {
      mockCreateJournal.mockRejectedValue(new Error('Journal error'));
      await expect(createIncome('outlet1', 'income1', 'deposit1', 2000, '2023-01-01', 'Jasa service', 'TRX-003'))
        .rejects.toThrow('Journal error');
    });

    it('should throw error and log if createPayable fails', async () => {
      mockCreateJournal.mockRejectedValue(new Error('Journal error'));
      await expect(createPayable('outlet1', 'payable1', 'target1', 1500, '2023-01-01', 'Beli barang ngutang', 'TRX-004', 'vendor1'))
        .rejects.toThrow('Journal error');
    });
  });
});
