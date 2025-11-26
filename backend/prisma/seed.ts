import { PrismaClient, UserRole, DriverStatus, ShopStatus, FulfillmentType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean up existing data
  try {
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.shopProduct.deleteMany();
    await prisma.masterProduct.deleteMany();
    await prisma.category.deleteMany();
    await prisma.shop.deleteMany();
    await prisma.address.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Cleaned up existing data');
  } catch (error) {
    console.warn('⚠️ Warning: Cleanup failed (might be empty db)', error);
  }

  // 2. Create Users
  const password = await argon2.hash('password123');

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@localbazaar.com',
      passwordHash: password,
      fullName: 'System Admin',
      role: UserRole.ADMIN,
      phone: '9876543210',
      isEmailVerified: true,
      referralCode: 'ADMIN001',
    },
  });
  console.log('👤 Created Admin:', admin.email);

  // Shopkeeper
  const shopkeeper = await prisma.user.create({
    data: {
      email: 'shop@localbazaar.com',
      passwordHash: password,
      fullName: 'Rahul Shopkeeper',
      role: UserRole.SHOPKEEPER,
      phone: '9876543211',
      isEmailVerified: true,
      referralCode: 'SHOP001',
    },
  });
  console.log('👤 Created Shopkeeper:', shopkeeper.email);

  // Driver
  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@localbazaar.com',
      passwordHash: password,
      fullName: 'Vikram Driver',
      role: UserRole.DRIVER,
      phone: '9876543212',
      isEmailVerified: true,
      referralCode: 'DRIVER001',
    },
  });
  console.log('👤 Created Driver User:', driverUser.email);

  // Create Driver Profile
  await prisma.driver.create({
    data: {
      userId: driverUser.id,
      status: DriverStatus.ACTIVE,
      isAvailable: true,
      vehicleDetails: {
        type: 'BIKE',
        number: 'KA-01-AB-1234',
        license: 'DL-1234567890',
      },
      // Note: Location is skipped for now as it requires raw SQL for PostGIS
    },
  });
  console.log('🚗 Created Driver Profile');

  // Customer
  const customer = await prisma.user.create({
    data: {
      email: 'user@localbazaar.com',
      passwordHash: password,
      fullName: 'Priya Customer',
      role: UserRole.CUSTOMER,
      phone: '9876543213',
      isEmailVerified: true,
      referralCode: 'USER001',
    },
  });
  console.log('👤 Created Customer:', customer.email);

  // 3. Create Shop
  const shop = await prisma.shop.create({
    data: {
      ownerId: shopkeeper.id,
      name: 'Fresh Local Market',
      slug: 'fresh-local-market',
      bio: 'Best quality fresh vegetables and fruits directly from farmers.',
      address: '123, MG Road, Indiranagar',
      city: 'Bangalore',
      pincode: '560038',
      status: ShopStatus.ACTIVE,
      isVerified: true,
      rating: 4.5,
      deliveryRadius: 5000, // 5km
      operatingHours: {
        monday: { open: '09:00', close: '21:00' },
        tuesday: { open: '09:00', close: '21:00' },
        wednesday: { open: '09:00', close: '21:00' },
        thursday: { open: '09:00', close: '21:00' },
        friday: { open: '09:00', close: '21:00' },
        saturday: { open: '09:00', close: '21:00' },
        sunday: { open: '09:00', close: '13:00' },
      },
      fulfillmentTypes: [FulfillmentType.HOME_DELIVERY, FulfillmentType.IN_STORE_PICKUP],
    },
  });
  console.log('🏪 Created Shop:', shop.name);

  // Update Shop Location (Raw SQL)
  await prisma.$executeRaw`
    UPDATE "Shop" 
    SET location = ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326) 
    WHERE id = ${shop.id}
  `;

  // 4. Create Categories
  const categories = [
    { name: 'Fruits', slug: 'fruits' },
    { name: 'Dairy', slug: 'dairy' },
    { name: 'Bakery', slug: 'bakery' },
    { name: 'Grains', slug: 'grains' },
  ];

  const categoryMap = new Map();
  for (const cat of categories) {
    const created = await prisma.category.create({
      data: cat,
    });
    categoryMap.set(cat.name, created.id);
  }

  // 5. Create Master Products & Shop Products
  const productsData = [
    {
      name: 'Organic Red Apples',
      slug: 'organic-red-apples',
      description: 'Fresh organic apples from Kashmir. Sweet and crunchy.',
      price: 180,
      category: 'Fruits',
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6',
    },
    {
      name: 'Fresh Farm Milk',
      slug: 'fresh-farm-milk',
      description: 'Pure cow milk, unpasteurized and organic.',
      price: 60,
      category: 'Dairy',
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b',
    },
    {
      name: 'Whole Wheat Bread',
      slug: 'whole-wheat-bread',
      description: 'Freshly baked whole wheat bread, no preservatives.',
      price: 45,
      category: 'Bakery',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
    },
    {
      name: 'Basmati Rice',
      slug: 'basmati-rice',
      description: 'Premium aged basmati rice for biryani.',
      price: 120,
      category: 'Grains',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c',
    },
  ];

  for (const p of productsData) {
    // Create Master Product
    const masterProduct = await prisma.masterProduct.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: categoryMap.get(p.category),
        images: [p.imageUrl],
        isApproved: true,
      },
    });

    // Add to Shop
    await prisma.shopProduct.create({
      data: {
        shopId: shop.id,
        masterProductId: masterProduct.id,
        name: p.name,
        slug: p.slug, // Using same slug for simplicity
        description: p.description,
        price: p.price,
        stock: 50,
        images: [p.imageUrl],
        isActive: true,
      },
    });
  }
  console.log('📦 Created Products and added to Shop');

  // 6. Create Address for Customer
  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      street: '456, 1st Main, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      country: 'India',
      isDefault: true,
    },
  });
  
  // Update Address Location (Raw SQL)
  await prisma.$executeRaw`
    UPDATE "Address" 
    SET coordinates = ST_SetSRID(ST_MakePoint(77.6245, 12.9352), 4326) 
    WHERE id = ${address.id}
  `;
  console.log('📍 Created Customer Address');

  console.log('✅ Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
