import dotenv from 'dotenv';
import { jest } from '@jest/globals';

// Load environment variables for testing if needed
dotenv.config({ path: '.env.test' });

// Mock logger to avoid console spam during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));
