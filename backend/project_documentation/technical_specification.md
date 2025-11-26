# LocalBazaar: Technical Specification

## 1. System Architecture Diagram

```mermaid
graph TD
    UserClient[User App (Flutter/Web)] --> LB[Load Balancer]
    ShopClient[Shop App (Flutter/Web)] --> LB
    DriverClient[Driver App (Flutter)] --> LB
    
    LB --> API[Backend API (Node.js/Express)]
    
    subgraph Data Layer
        API --> PrimaryDB[(PostgreSQL)]
        API --> Cache[(Redis Cluster)]
        API --> VectorDB[(pgvector / Pinecone)]
    end
    
    subgraph Async Processing
        API --> MsgQueue[Redis BullMQ]
        MsgQueue --> EmailWorker[Email Worker]
        MsgQueue --> ImageWorker[Image Optimization Worker]
        MsgQueue --> NotifWorker[Push Notification Worker]
    end
    
    subgraph AI Services
        API --> AIService[Python AI Service]
        AIService --> LLM[OpenAI / Llama 3]
        AIService --> VectorDB
    end
    
    subgraph External Services
        API --> Maps[Google Maps API]
        API --> Payment[Stripe / Razorpay]
        API --> Storage[AWS S3 / Cloudinary]
    end
```

---

## 2. Database Schema (Prisma / PostgreSQL)

This is the **definitive** schema for the application. It includes all necessary fields, relationships, and indexes.

### Enums

```prisma
enum UserRole {
  CUSTOMER
  SHOPKEEPER
  DRIVER
  ADMIN
}

enum UserStatus {
  ACTIVE
  BANNED
  PENDING_VERIFICATION
}

enum ShopStatus {
  ACTIVE
  CLOSED
  HOLIDAY
  PENDING_APPROVAL
  BANNED
}

enum OrderStatus {
  PENDING
  PENDING_SHOP_APPROVAL
  ACCEPTED_BY_SHOP
  DRIVER_ASSIGNED
  READY_FOR_PICKUP
  OUT_FOR_DELIVERY
  COMPLETED
  CANCELLED
  RETURNED
}

enum FulfillmentType {
  HOME_DELIVERY
  IN_STORE_PICKUP
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
}

enum DriverStatus {
  ACTIVE
  INACTIVE
  ON_DELIVERY
  BANNED
}

enum NegotiationStatus {
  OPEN
  ACCEPTED
  REJECTED
  CLOSED
}

enum NotificationType {
  ORDER_UPDATE
  NEGOTIATION_ACCEPTED
  REVIEW_RECEIVED
  PROMOTION
  DRIVER_ASSIGNED
  DELIVERY_COMPLETED
  PAYMENT_SUCCESS
  SHOP_VERIFIED
  SYSTEM
}

enum ReportStatus {
  PENDING
  UNDER_REVIEW
  RESOLVED
  DISMISSED
}
```prisma
model User {
  id                  String       @id @default(uuid())
  email               String       @unique
  phone               String?      @unique
  passwordHash        String
  role                UserRole     @default(CUSTOMER)
  fullName            String
  profileImage        String?
  status              UserStatus   @default(ACTIVE)
  referralCode        String       @unique
  isEmailVerified     Boolean      @default(false)
  isPhoneVerified     Boolean      @default(false)
  
  // Audit
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  deletedAt           DateTime?
  
  // Relations
  addresses           Address[]
  shops               Shop[]       @relation("ShopOwner")
  orders              Order[]
  driverProfile       Driver?
  reviews             Review[]
  negotiations        Negotiation[]
  sentMessages        ChatMessage[]
  notifications       Notification[]
  submittedReports    Report[]         @relation("Reporter")
  reportsAgainst      Report[]         @relation("ReportedUser")
  
  // New Relations
  packages            Package[]
  leaderboard         Leaderboard?
  postedBatches       FreelancingBatch[]
  assignedBatches     FreelancingBatch[] @relation("GigWorker")
  bids                Bid[]
  cart                Cart?
  wallet              Wallet?
  
  @@index([email])
  @@index([phone])
}

model Address {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  street      String
  city        String
  state       String
  pincode     String
  country     String   @default("India")
  isDefault   Boolean  @default(false)
  coordinates Unsupported("geometry(Point, 4326)")? // PostGIS
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Shop & Inventory
```prisma
model Shop {
  id                  String       @id @default(uuid())
  ownerId             String
  owner               User         @relation("ShopOwner", fields: [ownerId], references: [id])
  name                String
  slug                String       @unique
  bio                 String?
  images              String[]
  contactEmail        String?
  contactPhone        String?
  
  // Location
  address             String
  city                String
  pincode             String
  location            Unsupported("geometry(Point, 4326)") // PostGIS Index
  
  // Operations
  operatingHours      Json         // { "mon": { "open": "09:00", "close": "21:00" }, ... }
  fulfillmentTypes    FulfillmentType[]
  deliveryRadius      Int          // in meters
  minOrderValue       Decimal      @default(0)
  
  // Policies
  returnPolicy        String?
  shippingPolicy      String?
  
  // Status
  status              ShopStatus   @default(PENDING_APPROVAL)
  isVerified          Boolean      @default(false)
  verifiedAt          DateTime?
  
  // Metrics
  rating              Decimal      @default(0)
  reviewCount         Int          @default(0)
  
  // Relations
  products            ShopProduct[]
  orders              Order[]
  subscriptions       Subscription[]
  negotiations        Negotiation[]
  reviews             Review[]
  promotions          Promotion[]
  packages            Package[]
  wallet              Wallet?
  reports             Report[]
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  
  @@index([slug])
  @@index([status])
  // @@index([location], type: Gist) // PostGIS Index
}

model Category {
  id                  String       @id @default(uuid())
  name                String       @unique
  slug                String       @unique
  image               String?
  parentId            String?
  parent              Category?    @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children            Category[]   @relation("CategoryHierarchy")
  
  masterProducts      MasterProduct[]
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model Brand {
  id                  String       @id @default(uuid())
  name                String       @unique
  slug                String       @unique
  logo                String?
  website             String?
  
  masterProducts      MasterProduct[]
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model MasterProduct {
  id                  String       @id @default(uuid())
  name                String
  slug                String       @unique
  description         String?
  
  brandId             String?
  brand               Brand?       @relation(fields: [brandId], references: [id])
  
  categoryId          String
  category            Category     @relation(fields: [categoryId], references: [id])
  
  images              String[]
  defaultSpecifications Json?      // { "material": "cotton", "origin": "India" }
  
  isApproved          Boolean      @default(false)
  
  shopProducts        ShopProduct[]
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  
  @@index([name])
}

model ShopProduct {
  id                  String       @id @default(uuid())
  shopId              String
  shop                Shop         @relation(fields: [shopId], references: [id])
  
  // Link to Global Catalog
  masterProductId     String?
  masterProduct       MasterProduct? @relation(fields: [masterProductId], references: [id])
  
  // Overrides or Custom Product
  name                String       // Can override Master name or be custom
  slug                String
  description         String?
  
  // Pricing & Stock
  price               Decimal
  stock               Int          // Available for sale
  reservedStock       Int          @default(0) // Held in carts/pending orders
  discount            Decimal      @default(0)
  negotiationRange    Json?        // { "min": 100, "max": 120 }
  
  // Media (Specific to this shop's condition/variant)
  images              String[]
  
  // Details
  specifications      Json?        // { "condition": "new", "warranty": "1 year" }
  isActive            Boolean      @default(true)
  
  // Vector Search
  embedding           Unsupported("vector(1536)")?  // pgvector for semantic search
  
  // Relations
  variants            ProductVariant[]
  orderItems          OrderItem[]
  negotiations        Negotiation[]
  reviews             Review[]
  cartItems           CartItem[]
  reports             Report[]
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  
  @@unique([shopId, slug])
  @@index([name])
  @@index([isActive])
}

model ProductVariant {
  id                  String       @id @default(uuid())
  shopProductId       String
  shopProduct         ShopProduct  @relation(fields: [shopProductId], references: [id])
  
  name                String       // e.g., "Red / L"
  sku                 String?
  price               Decimal?     // Override base price
  stock               Int
  
  specifications      Json         // { "color": "red", "size": "L" }
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model Review {
  id                  String       @id @default(uuid())
  userId              String
  user                User         @relation(fields: [userId], references: [id])
  
  shopId              String?
  shop                Shop?        @relation(fields: [shopId], references: [id])
  
  productId           String?
  product             ShopProduct? @relation(fields: [productId], references: [id])
  
  rating              Int          // 1-5
  comment             String?
  images              String[]
  
  createdAt           DateTime     @default(now())
}

model Promotion {
  id                  String       @id @default(uuid())
  shopId              String
  shop                Shop         @relation(fields: [shopId], references: [id])
  
  code                String       @unique
  description         String?
  discountType        String       // "PERCENTAGE" or "FIXED"
  discountValue       Decimal
  minOrderValue       Decimal      @default(0)
  maxDiscount         Decimal?
  
  startDate           DateTime
  endDate             DateTime
  isActive            Boolean      @default(true)
  
  usageLimit          Int?
  usedCount           Int          @default(0)
  
  createdAt           DateTime     @default(now())
}

model MandiRecord {
  id                  String       @id @default(uuid())
  commodity           String       // e.g., "Tomato"
  variety             String?
  createdAt           DateTime     @default(now())
}

model Plan {
  id                  String       @id @default(uuid())
  name                String       @unique
  description         String?
  price               Decimal
  currency            String       @default("INR")
  durationDays        Int
  features            String[]
  isActive            Boolean      @default(true)
  priority            Int          @default(0)
  
  subscriptions       Subscription[]
  packages            Package[]
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model Subscription {
  id                  String       @id @default(uuid())
  shopId              String
  shop                Shop         @relation(fields: [shopId], references: [id])
  planId              String
  plan                Plan         @relation(fields: [planId], references: [id])
  
  startDate           DateTime     @default(now())
  endDate             DateTime
  status              String       // ACTIVE, EXPIRED, CANCELLED
  autoRenew           Boolean      @default(false)
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model Package {
  id                  String       @id @default(uuid())
  userId              String
  user                User         @relation(fields: [userId], references: [id])
  shopId              String
  shop                Shop         @relation(fields: [shopId], references: [id])
  planId              String
  plan                Plan         @relation(fields: [planId], references: [id])
  
  amount              Decimal
  currency            String       @default("INR")
  status              PaymentStatus
  invoiceUrl          String?
  transactionId       String?
  
  billingAddress      Json?
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model Leaderboard {
  id                  String       @id @default(uuid())
  userId              String
  user                User         @relation(fields: [userId], references: [id])
  
  type                String       // "DELIVERY_POINTS", "SALES_VOLUME"
  period              String       // "WEEKLY", "MONTHLY"
  score               Int          @default(0)
  rank                Int?
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  
  @@unique([userId, type, period])
}

model FreelancingBatch {
  id                  String       @id @default(uuid())
  postedById          String
  postedBy            User         @relation(fields: [postedById], references: [id])
  
  title               String
  description         String
  skillsRequired      String[]
  budget              Decimal?
  deadline            DateTime?
  
  status              String       // OPEN, ASSIGNED, COMPLETED
  assignedToId        String?
  assignedTo          User?        @relation("GigWorker", fields: [assignedToId], references: [id])
  
  bids                Bid[]
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model Bid {
  id                  String       @id @default(uuid())
  batchId             String
  batch               FreelancingBatch @relation(fields: [batchId], references: [id])
  userId              String
  user                User         @relation(fields: [userId], references: [id])
  
  amount              Decimal
  message             String?
  
  createdAt           DateTime     @default(now())
}

model Cart {
  id                  String       @id @default(uuid())
  userId              String       @unique
  user                User         @relation(fields: [userId], references: [id])
  
  items               CartItem[]
  
  updatedAt           DateTime     @updatedAt
}

model CartItem {
  id                  String       @id @default(uuid())
  cartId              String
  cart                Cart         @relation(fields: [cartId], references: [id])
  
  shopProductId       String
  shopProduct         ShopProduct  @relation(fields: [shopProductId], references: [id])
  
  quantity            Int
  price               Decimal      // Cached price
  selectedAttributes  Json?
}

model Wallet {
  id                  String       @id @default(uuid())
  userId              String?      @unique
  user                User?        @relation(fields: [userId], references: [id])
  shopId              String?      @unique
  shop                Shop?        @relation(fields: [shopId], references: [id])
  
  balance             Decimal      @default(0)
  currency            String       @default("INR")
  isActive            Boolean      @default(true)
  
  transactions        WalletTransaction[]
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model WalletTransaction {
  id                  String       @id @default(uuid())
  walletId            String
  wallet              Wallet       @relation(fields: [walletId], references: [id])
  
  amount              Decimal
  type                String       // CREDIT, DEBIT
  referenceId         String?      // OrderID, BatchID, PayoutID
  referenceType       String?      // "ORDER", "GIG_BATCH", "PAYOUT"
  description         String?
  
  status              String       // PENDING, COMPLETED, FAILED
  
  createdAt           DateTime     @default(now())
}

model Notification {
  id                  String       @id @default(uuid())
  userId              String
  user                User         @relation(fields: [userId], references: [id])
  
  type                NotificationType
  title               String
  message             String
  data                Json?        // Additional context (orderId, productId, etc.)
  
  isRead              Boolean      @default(false)
  readAt              DateTime?
  
  createdAt           DateTime     @default(now())
  
  @@index([userId, isRead])
  @@index([createdAt])
}

model Report {
  id                  String       @id @default(uuid())
  
  // Reporter
  reporterId          String
  reporter            User         @relation("Reporter", fields: [reporterId], references: [id])
  
  // Reported Entity (one of these will be set)
  reportedUserId      String?
  reportedUser        User?        @relation("ReportedUser", fields: [reportedUserId], references: [id])
  reportedShopId      String?
  reportedShop        Shop?        @relation(fields: [reportedShopId], references: [id])
  reportedProductId   String?
  reportedProduct     ShopProduct? @relation(fields: [reportedProductId], references: [id])
  reportedReviewId    String?
  reportedReview      Review?      @relation(fields: [reportedReviewId], references: [id])
  
  // Report Details
  reason              ReportReason
  description         String
  evidence            Json?        // Screenshots, links, etc.
  
  // Resolution
  status              ReportStatus @default(PENDING)
  resolvedBy          String?      // Admin user ID
  resolutionNotes     String?
  resolvedAt          DateTime?
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  
  @@index([status])
  @@index([reporterId])
}

model ChatMessage {
  id                  String       @id @default(uuid())
  negotiationId       String
  negotiation         Negotiation  @relation(fields: [negotiationId], references: [id])
  
  senderId            String
  sender              User         @relation(fields: [senderId], references: [id])
  
  message             String
  offerPrice          Decimal?
  isSystemMessage     Boolean      @default(false)
  
  createdAt           DateTime     @default(now())
  
  @@index([negotiationId])
  @@index([createdAt])
}

model Payment {
  id                  String       @id @default(uuid())
  orderId             String       @unique
  order               Order        @relation(fields: [orderId], references: [id])
  
  amount              Decimal
  currency            String       @default("INR")
  status              PaymentStatus
  
  // Payment Gateway
  gateway             String       // "STRIPE", "RAZORPAY"
  gatewayPaymentId    String?      // External payment ID
  gatewayResponse     Json?        // Full gateway response
  
  // Metadata
  method              String?      // "CARD", "UPI", "WALLET"
  failureReason       String?
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  
  @@index([status])
  @@index([orderId])
}
```

#### Orders & Transactions
```prisma
model Order {
  id                  String       @id @default(uuid())
  customerId          String
  customer            User         @relation(fields: [customerId], references: [id])
  shopId              String
  shop                Shop         @relation(fields: [shopId], references: [id])
  
  status              OrderStatus  @default(PENDING)
  fulfillmentType     FulfillmentType
  
  // Financials
  subtotal            Decimal
  deliveryFee         Decimal
  tax                 Decimal
  totalAmount         Decimal
  
  // Delivery
  driverId            String?
  driver              Driver?      @relation(fields: [driverId], references: [id])
  deliveryAddress     Json         // Snapshot of address
  deliveryCode        String?      // 4-digit OTP for delivery verification
  
  // Relations
  items               OrderItem[]
  payment             Payment?
  negotiationId       String?      // If order came from negotiation
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model OrderItem {
  id                  String       @id @default(uuid())
  orderId             String
  order               Order        @relation(fields: [orderId], references: [id])
  productId           String
  product             ShopProduct  @relation(fields: [productId], references: [id])
  
  quantity            Int
  price               Decimal      // Price at time of purchase
  productName         String       // Snapshot
}

model Payment {
  id                  String       @id @default(uuid())
  orderId             String       @unique
  order               Order        @relation(fields: [orderId], references: [id])
  
  amount              Decimal
  currency            String       @default("INR")
  status              PaymentStatus
  provider            String       // "STRIPE", "RAZORPAY", "CASH"
  transactionId       String?
  
  createdAt           DateTime     @default(now())
}
```

#### Logistics
```prisma
model Driver {
  id                  String       @id @default(uuid())
  userId              String       @unique
  user                User         @relation(fields: [userId], references: [id])
  
  status              DriverStatus @default(INACTIVE)
  isAvailable         Boolean      @default(false)
  currentLocation     Unsupported("geometry(Point, 4326)")?
  
  vehicleDetails      Json         // { "make": "Honda", "plate": "KA-01..." }
  rating              Decimal      @default(5.0)
  
  orders              Order[]
  
  updatedAt           DateTime     @updatedAt
}
```

#### Negotiation & Chat
```prisma
model Negotiation {
  id                  String       @id @default(uuid())
  customerId          String
  customer            User         @relation(fields: [customerId], references: [id])
  shopId              String
  shop                Shop         @relation(fields: [shopId], references: [id])
  productId           String
  product             ShopProduct  @relation(fields: [productId], references: [id])
  
  status              NegotiationStatus @default(OPEN)
  finalPrice          Decimal?
  
  messages            ChatMessage[]
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  
  @@unique([customerId, shopId, productId]) // One active negotiation per product per user
}

model ChatMessage {
  id                  String       @id @default(uuid())
  negotiationId       String
  negotiation         Negotiation  @relation(fields: [negotiationId], references: [id])
  senderId            String
  sender              User         @relation(fields: [senderId], references: [id])
  
  content             String
  offerPrice          Decimal?     // If this message contains a price offer
  
  createdAt           DateTime     @default(now())
}
```

---

## 3. Redis Implementation Strategy

### A. Key Namespaces
-   **Sessions**: `session:{userId}` -> `refreshToken` (TTL: 7 days)
-   **Product Cache**: `product:{id}` -> JSON String (TTL: 1 hour)
-   **Shop Cache**: `shop:{id}` -> JSON String (TTL: 1 hour)
-   **Category Products**: `category:{id}:products?page=1` -> List of IDs (TTL: 15 mins)
-   **Rate Limits**: `ratelimit:{ip}:{endpoint}` -> Counter (TTL: 1 min)
-   **Cart**: `cart:{userId}` -> JSON Object (TTL: 30 days)

### B. Message Queues (BullMQ)
1.  **`email-queue`**:
    -   `send-welcome-email`: Payload `{ userId, email, name }`
    -   `send-order-confirmation`: Payload `{ orderId, email }`
2.  **`image-queue`**:
    -   `optimize-image`: Payload `{ s3Key, bucket }` -> Resizes and converts to WebP.
3.  **`notification-queue`**:
    -   `push-notification`: Payload `{ fcmToken, title, body }`

---

## 4. AI Integration (Detailed)

### A. Smart Search (Semantic)
1.  **Ingestion**: When a Shopkeeper adds a product, the `ProductService` sends the `name` + `description` to the Python AI Service.
2.  **Embedding**: Python Service uses `sentence-transformers/all-MiniLM-L6-v2` (or OpenAI `text-embedding-3-small`) to generate a 384/1536-dim vector.
3.  **Storage**: The vector is stored in the `Product` table's `embedding` column.
4.  **Query**:
    -   User searches "running shoes for men".
    -   Backend generates vector for query.
    -   Prisma Raw Query: `SELECT * FROM "Product" ORDER BY embedding <=> $vector LIMIT 20;`

### B. Negotiation Auto-Bot
1.  **Trigger**: Customer sends an offer in `NegotiationChat`.
2.  **Check**: If `Shop.autoNegotiate` is enabled.
3.  **Logic**:
    -   Fetch `Product.negotiationRange` (e.g., Min: 100, Max: 120).
    -   Fetch `Product.price` (e.g., 150).
    -   **Scenario 1**: Offer = 110. (Above Min). **Action**: Accept.
    -   **Scenario 2**: Offer = 90. (Below Min). **Action**: Counter with 105.
    -   **Scenario 3**: Offer = 50. (Way below). **Action**: Reject politely.
4.  **Price Locking**:
    -   If negotiation is accepted, the system generates a `signed_price_token` (JWT) containing `{ userId, productId, price, exp }`.
    -   This token must be sent when adding the item to the cart to validate the discounted price.
5.  **LLM Layer**: Use a lightweight LLM to generate the *text response* so it sounds natural, not robotic. "I can't do 90, but I can do 105 for you!"

---

## 5. Security & Compliance
-   **Passwords**: Argon2id hashing.
-   **API Security**: Helmet.js, CORS (whitelisted domains), Rate Limiting (Redis).
-   **Data Validation**: Zod schemas for every endpoint.
-   **Audit Logging**: Middleware to log every write operation to an `AuditLog` table (or MongoDB collection for logs).
