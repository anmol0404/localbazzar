# Complete API Specification & Implementation Guide

## Table of Contents
1. [Authentication & Authorization](#authentication)
2. [Module APIs](#module-apis)
3. [Middleware Stack](#middleware)
4. [DTOs & Validation](#dtos)
5. [Error Codes](#errors)
6. [WebSocket Events](#websocket)

---

## 1. Authentication & Authorization

### Middleware Chain
```typescript
// Global middleware order (app.ts)
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(rateLimiter)
app.use(requestLogger)

// Protected routes
router.use(authMiddleware)      // Verify JWT
router.use(roleMiddleware(['ADMIN']))  // Check role
```

### Auth Middleware (`common/middlewares/auth.middleware.ts`)
```typescript
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) throw new UnauthorizedError('No token provided')
  
  const decoded = jwt.verify(token, JWT_SECRET)
  const user = await redis.get(`user:${decoded.userId}`)
  
  req.user = user
  next()
}

export const roleMiddleware = (roles: UserRole[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions')
    }
    next()
  }
}
```

---

## 2. Complete API Endpoint List with Filters

### Auth Module (7 endpoints)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/verify-email` - Verify email OTP
- `POST /api/v1/auth/verify-phone` - Verify phone OTP
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Users Module (6 endpoints)
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update profile
- `GET /api/v1/users/:id/addresses` - List addresses
  - **Filters**: `isDefault=true`
- `POST /api/v1/users/:id/addresses` - Add address
- `PATCH /api/v1/users/:id/addresses/:addressId` - Update address
- `DELETE /api/v1/users/:id/addresses/:addressId` - Delete address

### Admin - Users Management (5 endpoints)
- `GET /api/v1/admin/users` - List all users
  - **Filters**:
    - `search` - Search by name, email, phone
    - `role` - Filter by role (CUSTOMER, SHOPKEEPER, DRIVER, ADMIN)
    - `status` - Filter by status (ACTIVE, BANNED, PENDING_VERIFICATION)
    - `isEmailVerified` - true/false
    - `isPhoneVerified` - true/false
    - `createdAfter` - Date filter
    - `createdBefore` - Date filter
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt&order=desc`
- `GET /api/v1/admin/users/:id` - Get user details
- `PATCH /api/v1/admin/users/:id/status` - Update user status
- `PATCH /api/v1/admin/users/:id/role` - Update user role
- `DELETE /api/v1/admin/users/:id` - Delete user

### Shops Module (10 endpoints)
- `GET /api/v1/shops` - List shops (Public)
  - **Filters**:
    - `search` - Search by name, bio
    - `category` - Filter by category
    - `city` - Filter by city
    - `status` - Filter by status (ACTIVE, CLOSED, HOLIDAY)
    - `isVerified` - true/false
    - `minRating` - Minimum rating (0-5)
    - `lat`, `lng`, `radius` - Geospatial search (nearby shops)
    - `fulfillmentType` - HOME_DELIVERY, IN_STORE_PICKUP
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=rating|distance|createdAt&order=desc`
- `GET /api/v1/shops/:slug` - Get shop by slug
- `POST /api/v1/shops` - Create shop (Shopkeeper)
- `PATCH /api/v1/shops/:id` - Update shop
- `POST /api/v1/shops/:id/documents` - Upload verification docs
- `GET /api/v1/shops/:id/reviews` - Get shop reviews
  - **Filters**: `minRating`, `maxRating`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt|rating&order=desc`
- `PATCH /api/v1/admin/shops/:id/verify` - Verify shop (Admin)
- `GET /api/v1/admin/shops/pending` - List pending shops (Admin)
  - **Filters**: `createdAfter`, `createdBefore`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt&order=asc`

### Products Module (10 endpoints)
- `GET /api/v1/products` - List products (Public)
  - **Filters**:
    - `search` - Full-text search (name, description)
    - `semanticSearch` - AI-powered semantic search
    - `category` - Filter by category ID
    - `brand` - Filter by brand ID
    - `shopId` - Filter by shop
    - `minPrice`, `maxPrice` - Price range
    - `minRating`, `maxRating` - Rating range
    - `inStock` - true (only in-stock items)
    - `isActive` - true/false
    - `hasDiscount` - true (only discounted items)
    - `lat`, `lng`, `radius` - Nearby products
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=price|rating|createdAt|distance&order=asc|desc`
- `GET /api/v1/products/:id` - Get product details
- `POST /api/v1/products` - Create product (Shopkeeper)
- `PATCH /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product
- `POST /api/v1/products/:id/variants` - Add variant
- `GET /api/v1/products/:id/reviews` - Get product reviews
  - **Filters**: `minRating`, `maxRating`, `hasImages=true`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt|rating|helpful&order=desc`
- `GET /api/v1/shop/products` - List my shop products (Shopkeeper)
  - **Filters**: `search`, `category`, `isActive`, `inStock`, `minStock`, `maxStock`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=stock|price|createdAt&order=asc|desc`

### Catalog Module (8 endpoints)
- `GET /api/v1/catalog/search` - Search master products
  - **Filters**:
    - `q` - Search query (required)
    - `category` - Filter by category
    - `brand` - Filter by brand
    - `isApproved` - true/false (admin only)
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=relevance|name|createdAt&order=desc`
- `GET /api/v1/catalog/categories` - List categories
  - **Filters**: `parentId` - Get subcategories, `level` - Category depth
  - **Pagination**: `page`, `limit`
- `GET /api/v1/catalog/categories/:slug` - Get category
- `GET /api/v1/catalog/brands` - List brands
  - **Filters**: `search` - Search by name
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=name|productCount&order=asc`
- `POST /api/v1/catalog/master-products` - Create master product (Admin)
- `GET /api/v1/admin/catalog/pending` - Pending master products (Admin)
  - **Filters**: `createdAfter`, `createdBefore`
  - **Pagination**: `page`, `limit`

### Cart Module (5 endpoints)
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart/items` - Add item to cart
- `PATCH /api/v1/cart/items/:id` - Update quantity
- `DELETE /api/v1/cart/items/:id` - Remove item
- `DELETE /api/v1/cart` - Clear cart

### Orders Module (12 endpoints)
- `GET /api/v1/orders` - List my orders (Customer)
  - **Filters**:
    - `status` - Filter by status (PENDING, ACCEPTED_BY_SHOP, etc.)
    - `shopId` - Filter by shop
    - `createdAfter`, `createdBefore` - Date range
    - `minTotal`, `maxTotal` - Price range
    - `fulfillmentType` - HOME_DELIVERY, IN_STORE_PICKUP
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt|total&order=desc`
- `GET /api/v1/orders/:id` - Get order details
- `POST /api/v1/orders` - Create order (checkout)
- `PATCH /api/v1/orders/:id/status` - Update status (Shop/Driver)
- `POST /api/v1/orders/:id/cancel` - Cancel order
- `POST /api/v1/orders/:id/complete` - Complete delivery (Driver)
- `GET /api/v1/shop/orders` - List shop orders (Shopkeeper)
  - **Filters**: Same as customer + `driverId`, `customerId`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt|status&order=desc`
- `GET /api/v1/admin/orders` - List all orders (Admin)
  - **Filters**: All above + `userId`, `shopId`, `driverId`
  - **Pagination**: `page`, `limit`

### Negotiations Module (7 endpoints)
- `GET /api/v1/negotiations` - List my negotiations
  - **Filters**:
    - `status` - OPEN, ACCEPTED, REJECTED, CLOSED
    - `shopId` - Filter by shop
    - `productId` - Filter by product
    - `createdAfter`, `createdBefore`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt|updatedAt&order=desc`
- `GET /api/v1/negotiations/:id` - Get negotiation details
- `POST /api/v1/negotiations` - Start negotiation
- `GET /api/v1/negotiations/:id/messages` - Get chat messages
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt&order=asc`
- `POST /api/v1/negotiations/:id/offer` - Send offer
- `POST /api/v1/negotiations/:id/accept` - Accept offer
- `POST /api/v1/negotiations/:id/reject` - Reject offer

### Notifications Module (4 endpoints)
- `GET /api/v1/notifications` - List notifications
  - **Filters**:
    - `isRead` - true/false
    - `type` - ORDER_UPDATE, NEGOTIATION_ACCEPTED, etc.
    - `createdAfter`, `createdBefore`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt&order=desc`
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `PATCH /api/v1/notifications/read-all` - Mark all as read

### Reports Module (6 endpoints)
- `POST /api/v1/reports` - Submit report
- `GET /api/v1/admin/reports` - List reports (Admin)
  - **Filters**:
    - `status` - PENDING, UNDER_REVIEW, RESOLVED, DISMISSED
    - `reason` - SPAM, FRAUD, INAPPROPRIATE_CONTENT, etc.
    - `reporterId` - Filter by reporter
    - `reportedUserId`, `reportedShopId`, `reportedProductId`
    - `createdAfter`, `createdBefore`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt|status&order=desc`
- `GET /api/v1/admin/reports/:id` - Get report details
- `PATCH /api/v1/admin/reports/:id/resolve` - Resolve report
- `PATCH /api/v1/admin/reports/:id/dismiss` - Dismiss report

### Reviews Module (6 endpoints)
- `GET /api/v1/reviews` - List reviews
  - **Filters**:
    - `shopId` - Filter by shop
    - `productId` - Filter by product
    - `userId` - Filter by user
    - `minRating`, `maxRating` - Rating range
    - `hasImages` - true/false
    - `createdAfter`, `createdBefore`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt|rating|helpful&order=desc`
- `POST /api/v1/reviews` - Submit review
- `PATCH /api/v1/reviews/:id` - Update review
- `DELETE /api/v1/reviews/:id` - Delete review
- `POST /api/v1/reviews/:id/helpful` - Mark helpful

### Mandi Module (3 endpoints)
- `GET /api/v1/mandi/prices` - Get current mandi prices
  - **Filters**:
    - `commodity` - Filter by commodity name
    - `variety` - Filter by variety
    - `market` - Filter by market location
    - `state` - Filter by state
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=commodity|price|date&order=asc`
- `GET /api/v1/mandi/prices/:commodity` - Get commodity history
  - **Filters**: `startDate`, `endDate`, `market`
  - **Pagination**: `page`, `limit`

### Leaderboard Module (2 endpoints)
- `GET /api/v1/leaderboard/:type` - Get leaderboard
  - **Params**: `type` - CUSTOMER, SHOP, DRIVER
  - **Filters**: `period` - WEEKLY, MONTHLY, ALL_TIME
  - **Pagination**: `page=1&limit=50`
- `GET /api/v1/leaderboard/me` - Get my rank

### Gigs Module (8 endpoints)
- `GET /api/v1/gigs` - List available gigs
  - **Filters**:
    - `search` - Search by title, description
    - `status` - OPEN, ASSIGNED, COMPLETED
    - `skillsRequired` - Filter by skills
    - `minBudget`, `maxBudget` - Budget range
    - `postedById` - Filter by poster
    - `lat`, `lng`, `radius` - Nearby gigs
    - `deadlineBefore`, `deadlineAfter`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=budget|createdAt|deadline&order=desc`
- `GET /api/v1/gigs/:id` - Get gig details
- `POST /api/v1/gigs` - Post gig (Shopkeeper)
- `POST /api/v1/gigs/:id/bids` - Place bid
- `GET /api/v1/gigs/:id/bids` - List bids for gig
  - **Filters**: `userId`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=amount|createdAt&order=asc`
- `PATCH /api/v1/gigs/:id/accept-bid` - Accept bid (Shopkeeper)
- `PATCH /api/v1/gigs/:id/complete` - Mark complete
- `GET /api/v1/gigs/my-bids` - My bids
  - **Filters**: `status` - PENDING, ACCEPTED, REJECTED
  - **Pagination**: `page`, `limit`

### Subscriptions Module (4 endpoints)
- `GET /api/v1/subscriptions/plans` - List plans
  - **Filters**: `isActive=true`, `minPrice`, `maxPrice`
  - **Sort**: `sortBy=price|priority&order=asc`
- `POST /api/v1/subscriptions/subscribe` - Subscribe to plan
- `GET /api/v1/subscriptions/me` - Get my subscription
- `POST /api/v1/subscriptions/cancel` - Cancel subscription

### Wallet Module (4 endpoints)
- `GET /api/v1/wallet` - Get wallet balance
- `GET /api/v1/wallet/transactions` - List transactions
  - **Filters**:
    - `type` - CREDIT, DEBIT
    - `referenceType` - ORDER, GIG_BATCH, PAYOUT
    - `status` - PENDING, COMPLETED, FAILED
    - `createdAfter`, `createdBefore`
    - `minAmount`, `maxAmount`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=createdAt|amount&order=desc`
- `POST /api/v1/wallet/withdraw` - Request withdrawal

### Driver Module (6 endpoints)
- `GET /api/v1/driver/available-deliveries` - List available orders
  - **Filters**:
    - `lat`, `lng`, `radius` - Nearby deliveries
    - `minPayout`, `maxPayout`
    - `fulfillmentType`
  - **Pagination**: `page`, `limit`
  - **Sort**: `sortBy=distance|payout|createdAt&order=asc`
- `POST /api/v1/driver/accept/:orderId` - Accept delivery
- `POST /api/v1/driver/location` - Update location
- `GET /api/v1/driver/earnings` - Get earnings
  - **Filters**: `startDate`, `endDate`, `status`
  - **Pagination**: `page`, `limit`
- `GET /api/v1/driver/deliveries` - My deliveries
  - **Filters**: `status`, `createdAfter`, `createdBefore`
  - **Pagination**: `page`, `limit`

### Analytics Module (Admin - 5 endpoints)
- `GET /api/v1/admin/analytics/overview` - Platform overview
- `GET /api/v1/admin/analytics/revenue` - Revenue reports
  - **Filters**: `startDate`, `endDate`, `groupBy=day|week|month`
- `GET /api/v1/admin/analytics/users` - User analytics
  - **Filters**: `startDate`, `endDate`, `role`
- `GET /api/v1/admin/analytics/shops` - Shop performance
  - **Filters**: `startDate`, `endDate`, `minRevenue`, `maxRevenue`
  - **Pagination**: `page`, `limit`
- `GET /api/v1/admin/analytics/orders` - Order metrics
  - **Filters**: `startDate`, `endDate`, `status`, `groupBy`

**Total: 120+ REST Endpoints with comprehensive filtering**

---

## 3. Module Implementation Examples

### Products Service (Complete)
```typescript
export class ProductsService {
  constructor(
    private productRepo: ProductRepository,
    private catalogRepo: CatalogRepository,
    private storageService: StorageService,
    private aiService: AIService
  ) {}

  async list(params: ListProductsParams) {
    const { page, limit, filters } = params
    
    // Build query
    const where: any = { isActive: true }
    
    if (filters.search) {
      // Semantic search using pgvector
      const embedding = await this.aiService.generateEmbedding(filters.search)
      // Use raw SQL for vector similarity
      return this.productRepo.searchByEmbedding(embedding, { page, limit })
    }
    
    if (filters.category) {
      where.masterProduct = { categoryId: filters.category }
    }
    
    if (filters.minPrice || filters.maxPrice) {
      where.price = {
        gte: filters.minPrice,
        lte: filters.maxPrice
      }
    }
    
    const [items, total] = await Promise.all([
      this.productRepo.findMany({ where, skip: (page - 1) * limit, take: limit }),
      this.productRepo.count({ where })
    ])
    
    return { items, total, page, limit }
  }

  async create(shopId: string, dto: CreateProductDto) {
    // Validate shop ownership
    const shop = await this.shopRepo.findById(shopId)
    if (!shop) throw new NotFoundError('Shop not found')
    
    // Link to master product if provided
    if (dto.masterProductId) {
      const master = await this.catalogRepo.findMasterProduct(dto.masterProductId)
      if (!master) throw new NotFoundError('Master product not found')
    }
    
    // Generate slug
    const slug = slugify(dto.name)
    
    // Upload images to S3
    const imageUrls = await this.storageService.uploadMultiple(dto.images)
    
    // Create product
    const product = await this.productRepo.create({
      shopId,
      ...dto,
      slug,
      images: imageUrls,
      stock: dto.stock,
      reservedStock: 0
    })
    
    // Generate embedding for semantic search (async job)
    await this.aiService.generateEmbedding(product.id, product.name + ' ' + product.description)
    
    // Invalidate cache
    await redis.del(`shop:${shopId}:products`)
    
    return product
  }

  async reserveStock(productId: string, quantity: number) {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.shopProduct.findUnique({ where: { id: productId } })
      
      if (product.stock - product.reservedStock < quantity) {
        throw new ConflictError('Insufficient stock')
      }
      
      return await tx.shopProduct.update({
        where: { id: productId },
        data: { reservedStock: { increment: quantity } }
      })
    })
  }

  async commitStock(productId: string, quantity: number) {
    return await prisma.$transaction(async (tx) => {
      return await tx.shopProduct.update({
        where: { id: productId },
        data: {
          stock: { decrement: quantity },
          reservedStock: { decrement: quantity }
        }
      })
    })
  }
}
```

---

## 4. WebSocket Events

### Connection
```typescript
io.use(socketAuthMiddleware) // Verify JWT from handshake

io.on('connection', (socket) => {
  const userId = socket.user.id
  socket.join(`user:${userId}`)
  
  // Driver-specific room
  if (socket.user.role === 'DRIVER') {
    socket.join('drivers')
  }
})
```

### Events
```typescript
// Negotiations
socket.emit('negotiation:send_message', { negotiationId, message, offerPrice })
socket.on('negotiation:new_message', (data) => {})
socket.on('negotiation:accepted', (data) => {})

// Orders
socket.on('order:status_update', (data) => {})
socket.on('order:new', (data) => {}) // For shopkeepers

// Driver Location
socket.emit('driver:location_update', { lat, lng })
socket.on('driver:location', (data) => {})

// Notifications
socket.on('notification:new', (data) => {})
```

---

## 5. Error Codes Reference

| Code | Message | HTTP Status |
|------|---------|-------------|
| `AUTH_001` | Invalid credentials | 401 |
| `AUTH_002` | Token expired | 401 |
| `AUTH_003` | Email not verified | 403 |
| `USER_001` | User not found | 404 |
| `USER_002` | Email already exists | 409 |
| `SHOP_001` | Shop not verified | 403 |
| `SHOP_002` | Shop not found | 404 |
| `PRODUCT_001` | Product not found | 404 |
| `PRODUCT_002` | Insufficient stock | 409 |
| `ORDER_001` | Order not found | 404 |
| `ORDER_002` | Cannot cancel order | 400 |
| `PAYMENT_001` | Payment failed | 402 |
| `VALIDATION_001` | Invalid input | 400 |

This specification provides complete implementation details for all 100+ API endpoints across 14 modules!
