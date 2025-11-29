import { z } from 'zod';
import { NegotiationStatus } from '@prisma/client';

export const createNegotiationSchema = z.object({
  shopProductId: z.string().uuid(),
  initialPrice: z.number().min(0),
  quantity: z.number().int().min(1).default(1),
  message: z.string().optional(),
});

export const negotiationMessageSchema = z.object({
  content: z.string().min(1),
  price: z.number().optional(), // Optional new price proposal
});

export const updateNegotiationStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

export type CreateNegotiationDTO = z.infer<typeof createNegotiationSchema>;
export type NegotiationMessageDTO = z.infer<typeof negotiationMessageSchema>;
export type UpdateNegotiationStatusDTO = z.infer<typeof updateNegotiationStatusSchema>;
