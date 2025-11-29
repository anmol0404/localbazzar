import prisma from '../config/database.config';
import { CreateShopDTO, UpdateShopDTO, UpdateShopStatusDTO } from '../dtos/shops.dto';
import { ShopStatus, UserRole, OrderStatus } from '@prisma/client';

export class ShopService {
  // Create new shop
  async createShop(userId: string, data: CreateShopDTO) {
    // Check if user is SHOPKEEPER
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== UserRole.SHOPKEEPER && user?.role !== UserRole.ADMIN) {
      throw new Error('Only shopkeepers can create shops');
    }

    // Check slug uniqueness
    const existingSlug = await prisma.shop.findUnique({ where: { slug: data.slug } });
    if (existingSlug) {
      throw new Error('Shop URL (slug) is already taken');
    }

    // Create shop with raw query for PostGIS location
    // We first create the shop without location, then update it with raw query
    // Or we can use $executeRaw to insert everything, but Prisma create is safer for types.
    // Strategy: Create with Prisma, then update location immediately.

    const shop = await prisma.shop.create({
      data: {
        ownerId: userId,
        name: data.name,
        slug: data.slug,
        bio: data.bio,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        operatingHours: data.operatingHours || {},
        fulfillmentTypes: data.fulfillmentTypes,
        deliveryRadius: data.deliveryRadius,
        minOrderValue: data.minOrderValue,
        returnPolicy: data.returnPolicy,
        shippingPolicy: data.shippingPolicy,
        status: ShopStatus.PENDING_APPROVAL,
      },
    });

    // Update location with PostGIS
    await prisma.$executeRaw`
      UPDATE "Shop"
      SET location = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)
      WHERE id = ${shop.id}
    `;

    return shop;
  }

  // Get shop by ID or Slug
  async getShop(identifier: string) {
    const shop = await prisma.shop.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          }
        },
        _count: {
          select: { products: true, reviews: true }
        }
      }
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    return shop;
  }

  // Update shop
  async updateShop(userId: string, shopId: string, data: UpdateShopDTO) {
    // Verify ownership
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error('Shop not found');
    if (shop.ownerId !== userId) throw new Error('Unauthorized');

    // Update basic fields
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        name: data.name,
        bio: data.bio,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        operatingHours: data.operatingHours,
        fulfillmentTypes: data.fulfillmentTypes,
        deliveryRadius: data.deliveryRadius,
        minOrderValue: data.minOrderValue,
        returnPolicy: data.returnPolicy,
        shippingPolicy: data.shippingPolicy,
      },
    });

    // Update location if provided
    if (data.latitude && data.longitude) {
      await prisma.$executeRaw`
        UPDATE "Shop"
        SET location = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)
        WHERE id = ${shopId}
      `;
    }

    return updatedShop;
  }

  // Update shop status (Open/Close)
  async updateShopStatus(userId: string, shopId: string, status: ShopStatus) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error('Shop not found');
    if (shop.ownerId !== userId) throw new Error('Unauthorized');

    return await prisma.shop.update({
      where: { id: shopId },
      data: { status },
    });
  }

  // Get nearby shops
  async getNearbyShops(latitude: number, longitude: number, radiusKm: number = 10) {
    // Use raw query for PostGIS ST_DWithin
    const shops = await prisma.$queryRaw`
      SELECT 
        s.id, s.name, s.slug, s.address, s.city, s.status, s.rating, s."reviewCount", s.images,
        ST_Distance(
          s.location, 
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) as distance
      FROM "Shop" s
      WHERE ST_DWithin(
        s.location,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusKm * 1000}
      )
      AND s.status = 'ACTIVE'
      ORDER BY distance ASC
    `;

    return shops;
  }

  // Get my shops (for shopkeeper)
  async getMyShops(userId: string) {
    return await prisma.shop.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
  // Get all shops (public, paginated)
  async getAllShops(params: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // If status is provided, use it. Otherwise default to ACTIVE for public view, 
    // but for Admin we might want all. 
    // The controller should handle the default.
    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    } else if (!params.status) {
      // Default behavior for public API if no status specified
      where.status = ShopStatus.ACTIVE;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [shops, total] = await prisma.$transaction([
      prisma.shop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              fullName: true,
              email: true
            }
          },
          _count: {
            select: { products: true, reviews: true }
          }
        }
      }),
      prisma.shop.count({ where })
    ]);

    return {
      data: shops,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  // Get shop stats
  async getShopStats(userId: string) {
    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId },
      include: {
        _count: {
          select: { products: true, orders: true }
        }
      }
    });

    if (!shop) {
      return {
        revenue: 0,
        orders: 0,
        products: 0,
        growth: 0
      };
    }

    // Calculate total revenue
    const revenueResult = await prisma.order.aggregate({
      where: {
        shopId: shop.id,
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED] }
      },
      _sum: {
        totalAmount: true
      }
    });

    return {
      revenue: Number(revenueResult._sum.totalAmount || 0),
      orders: shop._count.orders,
      products: shop._count.products,
      growth: 12.5 // Mock growth for now
    };
  }
}

