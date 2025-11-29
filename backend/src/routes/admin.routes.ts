import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { PERMISSIONS } from '../config/permissions.config';

const router = Router();
const adminController = new AdminController();

// All routes require authentication
router.use(authenticate);

// Get Dashboard Stats
router.get('/stats', requirePermission(PERMISSIONS.SETTINGS_MANAGE), (req, res) => adminController.getStats(req, res));

export default router;
