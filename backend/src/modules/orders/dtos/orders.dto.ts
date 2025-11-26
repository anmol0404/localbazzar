import { z } from 'zod';
import { FulfillmentType, OrderStatus, PaymentStatus } from '@prisma/client';

// Cart DTOs
export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  selectedAttributes: z.record(z.string(), z.any()).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});

// Order DTOs
export const createOrderSchema = z.object({
  shopId: z.string().uuid(),
  fulfillmentType: z.nativeEnum(FulfillmentType),
  deliveryAddressId: z.string().uuid().optional(), // Required for HOME_DELIVERY
  paymentMethod: z.enum(['COD', 'ONLINE']),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type AddToCartDTO = z.infer<typeof addToCartSchema>;
export type UpdateCartItemDTO = z.infer<typeof updateCartItemSchema>;
export type CreateOrderDTO = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusDTO = z.infer<typeof updateOrderStatusSchema>;
