import { z } from 'zod';
import { PayoutStatus } from '@prisma/client';

// Payout DTOs
export const createPayoutRequestSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  notes: z.string().optional(),
});

export const updatePayoutStatusSchema = z.object({
  status: z.nativeEnum(PayoutStatus),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// Settings DTOs
export const updatePlatformSettingsSchema = z.object({
  key: z.string(),
  value: z.any(),
});

export type CreatePayoutRequestDTO = z.infer<typeof createPayoutRequestSchema>;
export type UpdatePayoutStatusDTO = z.infer<typeof updatePayoutStatusSchema>;
export type UpdatePlatformSettingsDTO = z.infer<typeof updatePlatformSettingsSchema>;
