import prisma from '../../../config/database.config';
import { SocketService } from '../../../providers/socket.provider';
import { 
  CreateDriverProfileDTO, 
  UpdateDriverStatusDTO, 
  UpdateLocationDTO, 
  VerifyDeliveryDTO 
} from '../dtos/drivers.dto';
import { DriverStatus, OrderStatus, UserRole } from '@prisma/client';

export class DriverService {
  private socketService = SocketService.getInstance();

  // Create or Update Driver Profile
  async createProfile(userId: string, data: CreateDriverProfileDTO) {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Ensure user has DRIVER role (or add it)
    if (user.role !== UserRole.DRIVER) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.DRIVER }
      });
    }

    // Upsert driver profile
    const driver = await prisma.driver.upsert({
      where: { userId },
      update: {
        vehicleDetails: data.vehicleDetails,
      },
      create: {
        userId,
        vehicleDetails: data.vehicleDetails,
        status: DriverStatus.INACTIVE, // Default to inactive
      }
    });

    return driver;
  }

  // Get Driver Profile
  async getProfile(userId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: { user: { select: { fullName: true, phone: true, profileImage: true } } }
    });
    if (!driver) throw new Error('Driver profile not found');
    return driver;
  }

  // Update Status
  async updateStatus(userId: string, data: UpdateDriverStatusDTO) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new Error('Driver profile not found');

    return await prisma.driver.update({
      where: { userId },
      data: {
        status: data.status,
        isAvailable: data.isAvailable ?? (data.status === DriverStatus.ACTIVE)
      }
    });
  }

  // Update Location
  async updateLocation(userId: string, data: UpdateLocationDTO) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new Error('Driver profile not found');

    // Update location using raw SQL for PostGIS
    await prisma.$executeRaw`
      UPDATE "Driver"
      SET "currentLocation" = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326),
          "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;

    // Emit location update to admins or relevant shops (future optimization)
    // this.socketService.emitToRoom('admin', 'driver:location', { userId, ...data });

    return { success: true };
  }

  // Get Nearby Orders (Available for pickup)
  async getNearbyOrders(userId: string, radiusKm: number = 5) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new Error('Driver profile not found');

    // Find orders that are READY_FOR_PICKUP and within radius of driver
    // This requires complex geospatial join between Driver location and Shop location
    // For simplicity, we'll fetch orders and filter, or use a raw query if we had Shop location in Order.
    // Since Order -> Shop -> Location, we can do it.

    // 1. Get driver location
    const driverLoc = await prisma.$queryRaw<{ lat: number; lng: number }[]>`
      SELECT ST_X("currentLocation"::geometry) as lng, ST_Y("currentLocation"::geometry) as lat
      FROM "Driver" WHERE "userId" = ${userId}
    `;

    if (!driverLoc || driverLoc.length === 0 || !driverLoc[0].lat) {
      throw new Error('Driver location not set');
    }

    const { lat, lng } = driverLoc[0];

    // 2. Find shops within radius
    const nearbyShops = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id 
      FROM "Shop"
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusKm * 1000}
      )
    `;

    const shopIds = nearbyShops.map((s: { id: string }) => s.id);

    if (shopIds.length === 0) return [];

    // 3. Find orders in those shops
    return await prisma.order.findMany({
      where: {
        shopId: { in: shopIds },
        status: OrderStatus.READY_FOR_PICKUP,
        driverId: null // Unassigned orders
      },
      include: {
        shop: { select: { name: true, address: true } },
        customer: { select: { fullName: true, phone: true } }
      }
    });
  }

  // Accept Order
  async acceptOrder(userId: string, orderId: string) {
    const driver = await prisma.driver.findUnique({ 
      where: { userId },
      include: { user: true }
    });
    if (!driver) throw new Error('Driver profile not found');
    if (driver.status !== DriverStatus.ACTIVE) throw new Error('Driver is not active');

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    if (order.status !== OrderStatus.READY_FOR_PICKUP) throw new Error('Order not available');
    if (order.driverId) throw new Error('Order already assigned');

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId: driver.id,
        status: OrderStatus.DRIVER_ASSIGNED
      },
      include: { shop: true, customer: true }
    });

    // Notify Shop and Customer
    this.socketService.emitToUser(updatedOrder.shop.ownerId, 'order:driver_assigned', { orderId });
    this.socketService.emitToUser(updatedOrder.customerId, 'order:driver_assigned', { 
      orderId, 
      driverName: driver.user?.fullName 
    });

    return updatedOrder;
  }

  // Verify Delivery (Complete Order)
  async verifyDelivery(userId: string, data: VerifyDeliveryDTO) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new Error('Driver profile not found');

    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new Error('Order not found');
    if (order.driverId !== driver.id) throw new Error('Unauthorized');

    if (order.deliveryCode !== data.deliveryCode) {
      throw new Error('Invalid delivery code');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: data.orderId },
      data: {
        status: OrderStatus.COMPLETED,
        payment: {
          update: {
            status: 'COMPLETED' // Assume COD payment collected or Online confirmed
          }
        }
      }
    });

    // Notify Customer
    this.socketService.emitToUser(order.customerId, 'order:completed', { orderId: order.id });

    return updatedOrder;
  }
}
