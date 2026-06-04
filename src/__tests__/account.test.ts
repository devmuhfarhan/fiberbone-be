import request from 'supertest';
import app from '../index';
import { getAccounts, createAccount } from '../services/accountService';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

jest.mock('../services/accountService');
jest.mock('../middlewares/authMiddleware');
jest.mock('../middlewares/roleMiddleware', () => ({
  authorizePermission: jest.fn().mockImplementation(() => (req: any, res: any, next: any) => next()),
  requireSuperadmin: jest.fn().mockImplementation((req: any, res: any, next: any) => next())
}));
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

const mockAuthenticateToken = authenticateToken as jest.Mock;
const mockAuthorizePermission = authorizePermission as jest.Mock;
const mockGetAccounts = getAccounts as jest.Mock;
const mockCreateAccount = createAccount as jest.Mock;

describe('Account API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user1', role: 'finance', outlet_id: 'outlet1' };
      req.cookies = { accessToken: 'token123' };
      next();
    });
    mockAuthorizePermission.mockImplementation(() => (req: any, res: any, next: any) => next());
  });

  it('should get accounts', async () => {
    const mockAccounts = [{ id: '1', code: '1000', name: 'Kas', type: 'Asset', balance_type: 'Debit' }];
    mockGetAccounts.mockResolvedValue(mockAccounts);

    const res = await request(app).get('/api/accounts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockAccounts);
  });

  it('should return 400 when missing required fields for create account', async () => {
    const res = await request(app).post('/api/accounts').send({ code: '1000' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should create account successfully', async () => {
    const payload = { code: '1000', name: 'Kas', type: 'Asset', balance_type: 'Debit' };
    const mockCreated = { id: '1', ...payload };
    mockCreateAccount.mockResolvedValue(mockCreated);

    const res = await request(app).post('/api/accounts').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockCreated);
  });
});
