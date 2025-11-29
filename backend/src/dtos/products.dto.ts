import { z } from 'zod';

// Category DTOs
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Brand DTOs
export const createBrandSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

// Master Product DTOs
export const createMasterProductSchema = z.object({
  name: z.string().min(3, 'Name is required'),
  slug: z.string().min(3, 'Slug is required'),
  description: z.string().optional(),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  images: z.array(z.string().url()).default([]),
  defaultSpecifications: z.record(z.string(), z.any()).optional(),
});

export const updateMasterProductSchema = createMasterProductSchema.partial();

// Shop Product DTOs
export const createShopProductSchema = z.object({
  shopId: z.string().uuid(),
  masterProductId: z.string().uuid().optional(), // Optional if custom product
  
  name: z.string().min(3, 'Name is required'),
  slug: z.string().min(3, 'Slug is required'),
  description: z.string().optional(),
  
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  discount: z.number().min(0).default(0),
  
  images: z.array(z.string().url()).default([]),
  specifications: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().default(true),
  
  negotiationRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
});

export const updateShopProductSchema = createShopProductSchema.partial().omit({ shopId: true });

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;
export type CreateBrandDTO = z.infer<typeof createBrandSchema>;
export type UpdateBrandDTO = z.infer<typeof updateBrandSchema>;
export type CreateMasterProductDTO = z.infer<typeof createMasterProductSchema>;
export type UpdateMasterProductDTO = z.infer<typeof updateMasterProductSchema>;
export type CreateShopProductDTO = z.infer<typeof createShopProductSchema>;
export type UpdateShopProductDTO = z.infer<typeof updateShopProductSchema>;
