import { Router } from 'express';
import { ShopController } from '../controllers/shops.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { PERMISSIONS } from '../config/permissions.config';

const router = Router();
const shopController = new ShopController();

// Public routes
// Public routes
router.get('/', (req, res) => shopController.getAllShops(req, res));
router.get('/nearby', (req, res) => shopController.getNearbyShops(req, res));

// Protected specific routes (must be before /:id)
router.get('/stats', authenticate, requirePermission(PERMISSIONS.SHOPS_READ), (req, res) => shopController.getShopStats(req, res));
router.get('/my-shops', authenticate, requirePermission(PERMISSIONS.SHOPS_READ), (req, res) => shopController.getMyShops(req, res));

// Public generic routes
router.get('/:id', (req, res) => shopController.getShop(req, res));

// Protected routes (General)
router.use(authenticate);

router.post('/', requirePermission(PERMISSIONS.SHOPS_CREATE), (req, res) => shopController.createShop(req, res));
router.patch('/:id', requirePermission(PERMISSIONS.SHOPS_UPDATE), (req, res) => shopController.updateShop(req, res));
router.patch('/:id/status', requirePermission(PERMISSIONS.SHOPS_UPDATE), (req, res) => shopController.updateShopStatus(req, res));

export default router;

