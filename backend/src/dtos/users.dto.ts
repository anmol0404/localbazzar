import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  profileImage: z.string().url().optional(),
});

export const addressSchema = z.object({
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(4, 'Valid pincode is required'),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateAddressSchema = addressSchema.partial();

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
export type CreateAddressDTO = z.infer<typeof addressSchema>;
export type UpdateAddressDTO = z.infer<typeof updateAddressSchema>;
