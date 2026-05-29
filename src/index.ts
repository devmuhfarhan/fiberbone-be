import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger';
import pool from './config/db';
import redis from './config/redis';
import { authenticateToken } from './middlewares/authMiddleware';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import outletRoutes from './routes/outletRoutes';
import permissionRoutes from './routes/permissionRoutes';
import productAttributeRoutes from './routes/productAttributeRoutes';
import productRoutes from './routes/productRoutes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Example public route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Fiberbone Backend API' });
});

// Example protected route
app.get('/api/protected', authenticateToken, (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route', user: (req as any).user });
});

// Register User routes
app.use('/api/users', userRoutes);

// Register Auth routes
app.use('/api/auth', authRoutes);

// Register Outlet routes
app.use('/api/outlets', outletRoutes);

// Register Permission routes
app.use('/api/permissions', permissionRoutes);

// Register Product Attribute routes (kategori & satuan)
app.use('/api/product-attributes', productAttributeRoutes);

// Register Product routes
app.use('/api/products', productRoutes);

// Register Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Example DB check route
app.get('/api/db-check', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connection successful', time: result.rows[0] });
  } catch (error) {
    logger.error('Database connection failed', error);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, async () => {
    logger.info(`Server is running on http://localhost:${port}`);
    // Sambungkan Redis saat startup
    await redis.connect().catch((err) => logger.error('Redis connect error', err));
  });
}

export default app;
