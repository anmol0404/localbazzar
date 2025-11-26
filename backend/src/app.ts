import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.config';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'LocalBazaar API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
import authRoutes from './modules/auth/routes/auth.routes';
import userRoutes from './modules/users/routes/users.routes';
import shopRoutes from './modules/shops/routes/shops.routes';
import productRoutes from './modules/products/routes/products.routes';
import orderRoutes from './modules/orders/routes/orders.routes';
import negotiationRoutes from './modules/negotiations/routes/negotiations.routes';
import driverRoutes from './modules/drivers/routes/drivers.routes';
import notificationRoutes from './modules/notifications/routes/notifications.routes';
import subscriptionRoutes from './modules/subscriptions/routes/subscriptions.routes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/shops', shopRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/negotiations', negotiationRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);

app.get('/api/v1', (req: Request, res: Response) => {
  res.json({ 
    message: 'LocalBazaar API v1',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      shops: '/api/v1/shops',
      products: '/api/v1/products',
      orders: '/api/v1/orders',
      negotiations: '/api/v1/negotiations',
      drivers: '/api/v1/drivers',
      notifications: '/api/v1/notifications',
      subscriptions: '/api/v1/subscriptions',
      docs: '/api/v1/docs (coming soon)'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

export default app;
