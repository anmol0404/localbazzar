import { Router } from 'express';
import { reportController } from '../controllers/reports.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Public (Authenticated) Routes
router.post(
  '/',
  authenticate,
  asyncHandler(reportController.createReport.bind(reportController))
);

import { UserRole } from '@prisma/client';

// Admin Routes
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(reportController.getReports.bind(reportController))
);

router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(reportController.getReportById.bind(reportController))
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(reportController.updateReportStatus.bind(reportController))
);

export default router;
