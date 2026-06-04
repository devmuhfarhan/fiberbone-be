import { createJournal } from '../services/journalService';
import * as journalModel from '../models/journalModel';
import * as accountModel from '../models/accountModel';

jest.mock('../models/journalModel');
jest.mock('../models/accountModel');
jest.mock('../utils/logger');
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    connect: jest.fn()
  }
}));

const mockCreateJournal = journalModel.createJournal as jest.Mock;
const mockFindByIdAndOutletId = accountModel.findByIdAndOutletId as jest.Mock;

describe('Journal Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if journal items are less than 2', async () => {
    const data: any = { items: [{ account_id: '1', debit: 100, credit: 0 }] };
    await expect(createJournal(data)).rejects.toThrow('Journal must have at least 2 items');
  });

  it('should throw error if account is not found', async () => {
    const data: any = {
      outlet_id: 'outlet1',
      items: [
        { account_id: '1', debit: 100, credit: 0 },
        { account_id: '2', debit: 0, credit: 100 }
      ]
    };
    mockFindByIdAndOutletId.mockResolvedValueOnce(null);
    await expect(createJournal(data)).rejects.toThrow('Account with ID 1 not found in this outlet');
  });

  it('should throw error if journal is not balanced', async () => {
    const data: any = {
      outlet_id: 'outlet1',
      items: [
        { account_id: '1', debit: 100, credit: 0 },
        { account_id: '2', debit: 0, credit: 50 }
      ]
    };
    mockFindByIdAndOutletId.mockResolvedValue({ id: '1' }); // Mock account exists
    await expect(createJournal(data)).rejects.toThrow('Journal is not balanced');
  });

  it('should create journal if balanced', async () => {
    const data: any = {
      outlet_id: 'outlet1',
      items: [
        { account_id: '1', debit: 100, credit: 0 },
        { account_id: '2', debit: 0, credit: 100 }
      ]
    };
    mockFindByIdAndOutletId.mockResolvedValue({ id: '1' }); // Mock account exists
    const mockCreated = { id: 'j1', ...data };
    mockCreateJournal.mockResolvedValue(mockCreated);

    const result = await createJournal(data);
    expect(result).toEqual(mockCreated);
    expect(mockCreateJournal).toHaveBeenCalledWith(data, undefined);
  });
});
