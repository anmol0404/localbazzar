import { z } from 'zod';
import { DriverStatus } from '@prisma/client';

export const createDriverProfileSchema = z.object({
  vehicleDetails: z.object({
    type: z.enum(['BIKE', 'SCOOTER', 'CAR', 'TRUCK']),
    plateNumber: z.string().min(1),
    model: z.string().optional(),
  }),
});

export const updateDriverStatusSchema = z.object({
  status: z.nativeEnum(DriverStatus),
  isAvailable: z.boolean().optional(),
});

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const verifyDeliverySchema = z.object({
  orderId: z.string().uuid(),
  deliveryCode: z.string().length(4),
});

export type CreateDriverProfileDTO = z.infer<typeof createDriverProfileSchema>;
export type UpdateDriverStatusDTO = z.infer<typeof updateDriverStatusSchema>;
export type UpdateLocationDTO = z.infer<typeof updateLocationSchema>;
export type VerifyDeliveryDTO = z.infer<typeof verifyDeliverySchema>;
