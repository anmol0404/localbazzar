import { Router } from 'express';
import { OrderController } from '../controllers/orders.controller';
import { authenticate, authorize } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const orderController = new OrderController();

// All routes require authentication
router.use(authenticate);

// Cart Routes
router.get('/cart', (req, res) => orderController.getCart(req, res));
router.post('/cart', (req, res) => orderController.addToCart(req, res));
router.patch('/cart/:id', (req, res) => orderController.updateCartItem(req, res));
router.delete('/cart/:id', (req, res) => orderController.removeFromCart(req, res));

// Order Routes
router.post('/', (req, res) => orderController.createOrder(req, res));
router.get('/', (req, res) => orderController.getOrders(req, res));
router.get('/:id', (req, res) => orderController.getOrder(req, res));

// Shopkeeper Routes
router.patch('/:id/status', authorize(UserRole.SHOPKEEPER, UserRole.ADMIN), (req, res) => orderController.updateOrderStatus(req, res));

export default router;
