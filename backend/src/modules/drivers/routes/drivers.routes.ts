import { Router } from 'express';
import { DriverController } from '../controllers/drivers.controller';
import { authenticate, authorize } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const driverController = new DriverController();

// All routes require authentication
router.use(authenticate);

// Profile management
router.post('/profile', driverController.createProfile);
router.get('/profile', driverController.getProfile);
router.patch('/status', driverController.updateStatus);

// Location & Orders (Require DRIVER role)
router.patch('/location', authorize(UserRole.DRIVER), driverController.updateLocation);
router.get('/orders/nearby', authorize(UserRole.DRIVER), driverController.getNearbyOrders);
router.post('/orders/:id/accept', authorize(UserRole.DRIVER), driverController.acceptOrder);
router.post('/verify-delivery', authorize(UserRole.DRIVER), driverController.verifyDelivery);

export default router;
