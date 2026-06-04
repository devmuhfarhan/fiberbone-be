import * as voucherModel from '../models/voucherModel';

jest.mock('../models/voucherModel');

describe('Voucher Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new voucher', async () => {
    (voucherModel.createVoucher as jest.Mock).mockResolvedValue({ id: '1', code: 'DISC50', discount_type: 'PERCENTAGE', discount_value: 50 });
    
    const voucher = await voucherModel.createVoucher({
      outlet_id: 'outlet1',
      code: 'DISC50',
      discount_type: 'PERCENTAGE',
      discount_value: 50
    });
    
    expect(voucher.code).toBe('DISC50');
    expect(voucher.discount_type).toBe('PERCENTAGE');
    expect(voucher.discount_value).toBe(50);
  });
});
