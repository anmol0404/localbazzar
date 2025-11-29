import { z } from 'zod';
import { ReportReason, ReportStatus } from '@prisma/client';

export const createReportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  reportedShopId: z.string().uuid().optional(),
  reportedProductId: z.string().uuid().optional(),
  reportedReviewId: z.string().uuid().optional(),
  reason: z.nativeEnum(ReportReason),
  description: z.string().min(10).max(1000),
  evidence: z.record(z.string(), z.any()).optional(),
});

export const updateReportStatusSchema = z.object({
  status: z.nativeEnum(ReportStatus),
  resolutionNotes: z.string().optional(),
});

export const markNotificationReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()),
});

export type CreateReportDTO = z.infer<typeof createReportSchema>;
export type UpdateReportStatusDTO = z.infer<typeof updateReportStatusSchema>;
export type MarkNotificationReadDTO = z.infer<typeof markNotificationReadSchema>;
