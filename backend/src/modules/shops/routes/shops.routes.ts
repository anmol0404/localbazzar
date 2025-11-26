import { Router } from 'express';
import { ShopController } from '../controllers/shops.controller';
import { authenticate, authorize } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const shopController = new ShopController();

// Public routes
// Public routes
router.get('/', (req, res) => shopController.getAllShops(req, res));
router.get('/nearby', (req, res) => shopController.getNearbyShops(req, res));
router.get('/:id', (req, res) => shopController.getShop(req, res));

// Protected routes
router.use(authenticate);

// Shopkeeper routes
router.post('/', authorize(UserRole.SHOPKEEPER, UserRole.ADMIN), (req, res) => shopController.createShop(req, res));
router.get('/my-shops', authorize(UserRole.SHOPKEEPER, UserRole.ADMIN), (req, res) => shopController.getMyShops(req, res));
router.patch('/:id', authorize(UserRole.SHOPKEEPER, UserRole.ADMIN), (req, res) => shopController.updateShop(req, res));
router.patch('/:id/status', authorize(UserRole.SHOPKEEPER, UserRole.ADMIN), (req, res) => shopController.updateShopStatus(req, res));

export default router;
