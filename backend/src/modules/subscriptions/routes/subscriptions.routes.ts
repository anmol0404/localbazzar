import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptions.controller';
import { authenticate, authorize } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const subscriptionController = new SubscriptionController();

// Public
router.get('/plans', subscriptionController.getPlans);

// Admin Only
router.post('/plans', authenticate, authorize(UserRole.ADMIN), subscriptionController.createPlan);

// Shopkeeper
router.post('/subscribe', authenticate, authorize(UserRole.SHOPKEEPER, UserRole.ADMIN), subscriptionController.createSubscription);
router.get('/shop/:shopId', authenticate, authorize(UserRole.SHOPKEEPER, UserRole.ADMIN), subscriptionController.getShopSubscription);

export default router;
