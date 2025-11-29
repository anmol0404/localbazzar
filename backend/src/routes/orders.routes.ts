import { Router } from 'express';
import { OrderController } from '../controllers/orders.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireShop } from '../middlewares/requireShop.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { PERMISSIONS } from '../config/permissions.config';

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
router.post('/', requirePermission(PERMISSIONS.ORDERS_CREATE), (req, res) => orderController.createOrder(req, res));
router.get('/my-orders', requirePermission(PERMISSIONS.ORDERS_READ), (req, res) => orderController.getOrders(req, res));
router.get('/', requirePermission(PERMISSIONS.ORDERS_READ), (req, res) => orderController.getOrders(req, res));
router.get('/:id', requirePermission(PERMISSIONS.ORDERS_READ), (req, res) => orderController.getOrder(req, res));

// Shopkeeper Routes
router.patch('/:id/status', requirePermission(PERMISSIONS.ORDERS_MANAGE), requireShop, (req, res) => orderController.updateOrderStatus(req, res));

export default router;

