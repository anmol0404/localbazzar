import { z } from 'zod';
import { FulfillmentType } from '@prisma/client';

export const createShopSchema = z.object({
  name: z.string().min(3, 'Shop name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  bio: z.string().optional(),
  description: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  
  // Location
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  pincode: z.string().min(4, 'Pincode is required'),
  latitude: z.number(),
  longitude: z.number(),
  
  // Operations
  operatingHours: z.record(z.string(), z.any()).optional(), // JSON
  fulfillmentTypes: z.array(z.nativeEnum(FulfillmentType)).min(1, 'At least one fulfillment type is required'),
  deliveryRadius: z.number().min(0, 'Delivery radius must be positive'),
  minOrderValue: z.number().min(0).default(0),
  
  // Policies
  returnPolicy: z.string().optional(),
  shippingPolicy: z.string().optional(),
});

export const updateShopSchema = createShopSchema.partial();

export const shopStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'CLOSED', 'HOLIDAY', 'PENDING_APPROVAL', 'BANNED']),
});

export type CreateShopDTO = z.infer<typeof createShopSchema>;
export type UpdateShopDTO = z.infer<typeof updateShopSchema>;
export type UpdateShopStatusDTO = z.infer<typeof shopStatusSchema>;
