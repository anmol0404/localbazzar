import { Router } from 'express';
import { FinanceController } from '../controllers/finance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { PERMISSIONS } from '../config/permissions.config';

const router = Router();
const financeController = new FinanceController();

router.use(authenticate);

// Payouts (Shopkeeper)
router.post('/payouts', requirePermission(PERMISSIONS.PAYOUTS_REQUEST), (req, res) => financeController.createPayoutRequest(req, res));
router.get('/payouts/my-payouts/:shopId', requirePermission(PERMISSIONS.PAYOUTS_READ), (req, res) => financeController.getShopPayouts(req, res));

// Payouts (Admin)
router.get('/payouts', requirePermission(PERMISSIONS.PAYOUTS_READ), (req, res) => financeController.getPayoutRequests(req, res));
router.patch('/payouts/:id/status', requirePermission(PERMISSIONS.PAYOUTS_APPROVE), (req, res) => financeController.updatePayoutStatus(req, res));

// Settings (Admin)
router.get('/settings', requirePermission(PERMISSIONS.SETTINGS_MANAGE), (req, res) => financeController.getPlatformSettings(req, res));
router.put('/settings', requirePermission(PERMISSIONS.SETTINGS_MANAGE), (req, res) => financeController.updatePlatformSettings(req, res));

export default router;

