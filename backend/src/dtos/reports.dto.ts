import { z } from 'zod';
import { ReportTargetType, ReportReason } from '@prisma/client';

export const createReportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().uuid(),
  reason: z.nativeEnum(ReportReason),
  description: z.string().min(10, "Description must be at least 10 characters long").max(1000),
  metadata: z.record(z.string(), z.any()).optional(),
  evidence: z.record(z.string(), z.any()).optional(),
});

export type CreateReportDTO = z.infer<typeof createReportSchema>;

export const updateReportStatusSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']),
  resolutionNotes: z.string().optional(),
});
