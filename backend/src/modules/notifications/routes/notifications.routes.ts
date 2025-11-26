import { Router } from 'express';
import { NotificationController } from '../controllers/notifications.controller';
import { authenticate, authorize } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const notificationController = new NotificationController();

router.use(authenticate);

// Notifications
router.get('/', notificationController.getNotifications);
router.post('/read', notificationController.markAsRead);

// Reports
router.post('/reports', notificationController.createReport);
router.get('/reports', notificationController.getReports);
router.patch('/reports/:id', authorize(UserRole.ADMIN), notificationController.updateReportStatus);

export default router;
