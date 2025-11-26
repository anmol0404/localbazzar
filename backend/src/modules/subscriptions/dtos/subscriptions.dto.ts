import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.number().min(0),
  durationDays: z.number().int().min(1),
  features: z.array(z.string()),
  priority: z.number().int().default(0),
});

export const createSubscriptionSchema = z.object({
  shopId: z.string().uuid(),
  planId: z.string().uuid(),
  paymentMethod: z.enum(['CARD', 'UPI', 'NET_BANKING']),
});

export type CreatePlanDTO = z.infer<typeof createPlanSchema>;
export type CreateSubscriptionDTO = z.infer<typeof createSubscriptionSchema>;
