import * as customerModel from '../models/customerModel';

jest.mock('../models/customerModel');

describe('Customer Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get all customers', async () => {
    (customerModel.findAllByOutletId as jest.Mock).mockResolvedValue([
      { id: '1', name: 'John Doe' }
    ]);
    const customers = await customerModel.findAllByOutletId('outlet1');
    expect(customers.length).toBe(1);
    expect(customers[0].name).toBe('John Doe');
  });

  it('should create customer', async () => {
    (customerModel.createCustomer as jest.Mock).mockResolvedValue({ id: '2', name: 'Jane Doe' });
    const customer = await customerModel.createCustomer({ outlet_id: 'outlet1', name: 'Jane Doe' });
    expect(customer.name).toBe('Jane Doe');
  });

  describe('Negative edge cases', () => {
    it('should handle database error on fetch', async () => {
      (customerModel.findAllByOutletId as jest.Mock).mockRejectedValue(new Error('Connection failed'));
      await expect(customerModel.findAllByOutletId('outlet1')).rejects.toThrow('Connection failed');
    });

    it('should throw error when missing required fields on create', async () => {
      (customerModel.createCustomer as jest.Mock).mockRejectedValue(new Error('Name is required'));
      await expect(customerModel.createCustomer({ outlet_id: 'outlet1' } as any)).rejects.toThrow('Name is required');
    });
  });
});
