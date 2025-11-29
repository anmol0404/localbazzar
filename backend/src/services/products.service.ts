import prisma from '../config/database.config';
import { 
  CreateCategoryDTO, UpdateCategoryDTO,
  CreateBrandDTO, UpdateBrandDTO,
  CreateMasterProductDTO, UpdateMasterProductDTO,
  CreateShopProductDTO, UpdateShopProductDTO
} from '../dtos/products.dto';

export class ProductService {
  // ==================== CATEGORIES ====================
  
  async createCategory(data: CreateCategoryDTO) {
    return await prisma.category.create({ data });
  }

  async getCategories() {
    return await prisma.category.findMany({
      include: { children: true },
      where: { parentId: null } // Get root categories
    });
  }

  async updateCategory(id: string, data: UpdateCategoryDTO) {
    return await prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    return await prisma.category.delete({ where: { id } });
  }

  // ==================== BRANDS ====================

  async createBrand(data: CreateBrandDTO) {
    return await prisma.brand.create({ data });
  }

  async getBrands() {
    return await prisma.brand.findMany();
  }

  async updateBrand(id: string, data: UpdateBrandDTO) {
    return await prisma.brand.update({ where: { id }, data });
  }

  async deleteBrand(id: string) {
    return await prisma.brand.delete({ where: { id } });
  }

  // ==================== MASTER PRODUCTS ====================

  async createMasterProduct(data: CreateMasterProductDTO) {
    return await prisma.masterProduct.create({ data });
  }

  async getMasterProducts(query: string = '', categoryId?: string) {
    return await prisma.masterProduct.findMany({
      where: {
        AND: [
          query ? { name: { contains: query, mode: 'insensitive' } } : {},
          categoryId ? { categoryId } : {}
        ]
      },
      include: { brand: true, category: true }
    });
  }

  // ==================== SHOP PRODUCTS ====================

  async createShopProduct(userId: string, data: CreateShopProductDTO) {
    // Verify shop ownership
    const shop = await prisma.shop.findUnique({ where: { id: data.shopId } });
    if (!shop) throw new Error('Shop not found');
    if (shop.ownerId !== userId) throw new Error('Unauthorized');

    // Create product
    return await prisma.shopProduct.create({
      data: {
        shopId: data.shopId,
        masterProductId: data.masterProductId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        stock: data.stock,
        discount: data.discount,
        images: data.images,
        specifications: data.specifications,
        isActive: data.isActive,
        negotiationRange: data.negotiationRange,
      }
    });
  }

  async getShopProducts(shopId: string) {
    return await prisma.shopProduct.findMany({
      where: { shopId },
      include: { masterProduct: true }
    });
  }

  async getProduct(id: string) {
    return await prisma.shopProduct.findUnique({
      where: { id },
      include: { 
        shop: { select: { id: true, name: true, slug: true, rating: true } },
        masterProduct: { include: { brand: true, category: true } }
      }
    });
  }

  async updateShopProduct(userId: string, productId: string, data: UpdateShopProductDTO) {
    // Verify ownership
    const product = await prisma.shopProduct.findUnique({ 
      where: { id: productId },
      include: { shop: true }
    });
    
    if (!product) throw new Error('Product not found');
    if (product.shop.ownerId !== userId) throw new Error('Unauthorized');

    return await prisma.shopProduct.update({
      where: { id: productId },
      data
    });
  }

  async deleteShopProduct(userId: string, productId: string) {
    const product = await prisma.shopProduct.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');
    
    const shop = await prisma.shop.findUnique({ where: { id: product.shopId } });
    if (!shop || shop.ownerId !== userId) throw new Error('Unauthorized');

    return prisma.shopProduct.delete({
      where: { id: productId }
    });
  }

  // Search products (Basic search for now, Semantic search requires pgvector + OpenAI)
  async searchProducts(query: string) {
    return await prisma.shopProduct.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ],
        isActive: true,
        shop: { status: 'ACTIVE' }
      },
      include: {
        shop: { select: { id: true, name: true, city: true, rating: true } }
      },
      take: 20
    });
  }
}

