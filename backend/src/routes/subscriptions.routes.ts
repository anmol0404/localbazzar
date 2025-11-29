import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptions.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { PERMISSIONS } from '../config/permissions.config';

const router = Router();
const subscriptionController = new SubscriptionController();

// Public
router.get('/plans', subscriptionController.getPlans);

// Admin Only
router.post('/plans', authenticate, requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE), subscriptionController.createPlan);

// Shopkeeper
router.post('/subscribe', authenticate, requirePermission(PERMISSIONS.SUBSCRIPTIONS_PURCHASE), subscriptionController.createSubscription);
router.get('/shop/:shopId', authenticate, requirePermission(PERMISSIONS.SUBSCRIPTIONS_READ), subscriptionController.getShopSubscription);

export default router;

