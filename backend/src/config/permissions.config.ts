export const PERMISSIONS = {
  // User Management
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  USERS_APPROVE: 'users:approve',

  // Shop Management
  SHOPS_CREATE: 'shops:create',
  SHOPS_READ: 'shops:read',
  SHOPS_UPDATE: 'shops:update',
  SHOPS_DELETE: 'shops:delete',
  SHOPS_APPROVE: 'shops:approve',
  SHOPS_VERIFY: 'shops:verify',

  // Product Management
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_APPROVE: 'products:approve',
  
  // Catalog Management (Categories, Brands)
  CATALOG_MANAGE: 'catalog:manage',

  // Order Management
  ORDERS_READ: 'orders:read',
  ORDERS_CREATE: 'orders:create',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_DELETE: 'orders:delete',
  ORDERS_MANAGE: 'orders:manage',

  // Driver Management
  DRIVERS_READ: 'drivers:read',
  DRIVERS_UPDATE: 'drivers:update',
  DRIVERS_APPROVE: 'drivers:approve',
  DRIVERS_LOCATION: 'drivers:location',

  // Negotiations
  NEGOTIATIONS_READ: 'negotiations:read',
  NEGOTIATIONS_CREATE: 'negotiations:create',
  NEGOTIATIONS_UPDATE: 'negotiations:update',
  NEGOTIATIONS_MANAGE: 'negotiations:manage',

  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_CREATE: 'reports:create',
  REPORTS_MANAGE: 'reports:manage',

  // Subscriptions
  SUBSCRIPTIONS_READ: 'subscriptions:read',
  SUBSCRIPTIONS_MANAGE: 'subscriptions:manage', // Admin: create plans
  SUBSCRIPTIONS_PURCHASE: 'subscriptions:purchase', // Shopkeeper: buy plan

  // Finance
  PAYOUTS_READ: 'payouts:read',
  PAYOUTS_REQUEST: 'payouts:request',
  PAYOUTS_APPROVE: 'payouts:approve',
  
  // System
  SETTINGS_MANAGE: 'settings:manage',
  LOGS_READ: 'logs:read',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
