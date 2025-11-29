import { Router } from 'express';
import { DriverController } from '../controllers/drivers.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { PERMISSIONS } from '../config/permissions.config';

const router = Router();
const driverController = new DriverController();

// All routes require authentication
router.use(authenticate);

// Profile management
router.post('/profile', driverController.createProfile);
router.get('/profile', driverController.getProfile);
router.patch('/status', requirePermission(PERMISSIONS.DRIVERS_UPDATE), driverController.updateStatus);

// Location & Orders (Require DRIVER role)
router.patch('/location', requirePermission(PERMISSIONS.DRIVERS_LOCATION), driverController.updateLocation);
router.get('/orders/nearby', requirePermission(PERMISSIONS.ORDERS_READ), driverController.getNearbyOrders);
router.post('/orders/:id/accept', requirePermission(PERMISSIONS.ORDERS_MANAGE), driverController.acceptOrder);
router.post('/verify-delivery', requirePermission(PERMISSIONS.ORDERS_MANAGE), driverController.verifyDelivery);

export default router;

