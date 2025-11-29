import prisma from '../config/database.config';
import { UpdateProfileDTO, CreateAddressDTO, UpdateAddressDTO } from '../dtos/users.dto';
import { UserRole, ShopStatus } from '@prisma/client';

export class UserService {
  // Get user profile with addresses
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;

    // Get shop status if shopkeeper
    let shopStatus = null;
    let hasShop = false;

    if (user.role === UserRole.SHOPKEEPER) {
      const shop = await prisma.shop.findFirst({
        where: { ownerId: user.id },
        select: { status: true }
      });
      if (shop) {
        shopStatus = shop.status;
        hasShop = true;
      }
    }

    return {
      ...safeUser,
      shopStatus,
      hasShop
    };
  }

  // Update user profile
  async updateProfile(userId: string, data: UpdateProfileDTO) {
    // Check phone uniqueness if being updated
    if (data.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          id: { not: userId },
        },
      });

      if (existingPhone) {
        throw new Error('Phone number already in use');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        profileImage: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // Add new address
  async addAddress(userId: string, data: CreateAddressDTO) {
    // If this is the first address or set as default, handle default logic
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    } else {
      // If no addresses exist, make this one default automatically
      const count = await prisma.address.count({ where: { userId } });
      if (count === 0) {
        data.isDefault = true;
      }
    }

    // Handle coordinates if provided
    // Note: Prisma doesn't support PostGIS geometry directly in create/update yet without raw query
    // For now we'll skip the raw geometry insert to keep it simple, 
    // or we can add it via $executeRaw if strictly needed for this phase.
    // We'll rely on the schema fields. The schema has `coordinates Unsupported("geometry(Point, 4326)")?`
    // We will need to use a raw query to update the coordinates column if lat/long are provided.

    const address = await prisma.address.create({
      data: {
        userId,
        street: data.street,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
        isDefault: data.isDefault,
      },
    });

    if (data.latitude && data.longitude) {
      await prisma.$executeRaw`
        UPDATE "Address"
        SET coordinates = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)
        WHERE id = ${address.id}
      `;
    }

    return address;
  }

  // Update address
  async updateAddress(userId: string, addressId: string, data: UpdateAddressDTO) {
    // Verify ownership
    const existingAddress = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new Error('Address not found');
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: addressId },
      data: {
        street: data.street,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
        isDefault: data.isDefault,
      },
    });

    if (data.latitude && data.longitude) {
      await prisma.$executeRaw`
        UPDATE "Address"
        SET coordinates = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)
        WHERE id = ${address.id}
      `;
    }

    return address;
  }

  // Delete address
  async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    return { success: true };
  }

  // Get user addresses
  async getAddresses(userId: string) {
    return await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  // Get all users (Admin)
  async getAllUsers(params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.role = params.role;
    }

    if (params.status) {
      where.status = params.status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Update user status (Admin)
  async updateUserStatus(userId: string, status: any) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    return await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });
  }
}

