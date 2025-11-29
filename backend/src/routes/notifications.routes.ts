import { Router } from 'express';
import { NotificationController } from '../controllers/notifications.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { PERMISSIONS } from '../config/permissions.config';

const router = Router();
const notificationController = new NotificationController();

router.use(authenticate);

// Notifications
router.get('/', notificationController.getNotifications);
router.post('/read', notificationController.markAsRead);

// Reports
router.post('/reports', requirePermission(PERMISSIONS.REPORTS_CREATE), notificationController.createReport);
router.get('/reports', requirePermission(PERMISSIONS.REPORTS_READ), notificationController.getReports);
router.patch('/reports/:id', requirePermission(PERMISSIONS.REPORTS_MANAGE), notificationController.updateReportStatus);

export default router;

