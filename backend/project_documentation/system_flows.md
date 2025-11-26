# LocalBazaar: System Flows & Logic Validation

This document details the step-by-step flows for critical system operations. It serves to validate the architecture and ensure no logical gaps exist.

## 1. Authentication & Onboarding Flow

### A. Customer Signup
1.  **User Action**: Enters Email, Phone, Password.
2.  **System**:
    -   Validates input (Zod).
    -   Checks DB for existing Email/Phone.
    -   Hashes password (Argon2).
    -   Creates `User` record with status `PENDING_VERIFICATION`.
    -   Generates 6-digit OTP for Email and Phone.
    -   Stores OTP in Redis: `auth:otp:{userId}:email` (TTL: 10m).
    -   **Event**: `auth.registered` -> Triggers Email/SMS Worker.
3.  **User Action**: Enters OTPs.
4.  **System**:
    -   Verifies OTPs against Redis.
    -   Updates `User` status to `ACTIVE`.
    -   Generates JWT (Access + Refresh).
    -   Returns Tokens + User Profile.

### B. Shopkeeper Onboarding (The "Break" Fix: Verification)
*Gap Identified*: How does a shopkeeper actually get verified? Who checks the documents?
*Fix*: Added `Admin` review step and `ShopStatus` transitions.

1.  **User Action**: Registers as Shopkeeper (or upgrades existing account).
2.  **User Action**: Creates `Shop` profile (Name, Address, Category).
3.  **System**: Creates `Shop` with status `PENDING_APPROVAL`.
4.  **User Action**: Uploads Documents (ID Proof, License) to S3/Cloudinary.
5.  **System**:
    -   Updates `Shop` with document URLs.
    -   **Event**: `shop.submitted_for_review` -> Notifies Admin Dashboard.
6.  **Admin Action**: Reviews documents.
7.  **Admin Action**: Clicks "Approve".
8.  **System**:
    -   Updates `Shop` status to `ACTIVE`.
    -   **Event**: `shop.approved` -> Sends Email/Push to Shopkeeper.

### C. Shopkeeper Listing Flow (Global Catalog Pattern)
1.  **Shopkeeper Action**: Scans barcode or searches "iPhone 15".
2.  **System**:
    -   Searches `MasterProduct` table (Elasticsearch/pgvector).
    -   *Scenario A (Found)*: Returns "iPhone 15 - Apple".
        -   Shopkeeper clicks "Sell Yours".
        -   Enters Price, Stock, Condition.
        -   System creates `ShopProduct` linked to `MasterProduct`.
    -   *Scenario B (Not Found)*:
        -   Shopkeeper clicks "Create New Product".
        -   Enters details (Name, Brand, Category, Images).
        -   System creates `MasterProduct` (Status: `PENDING_APPROVAL`) AND `ShopProduct`.
        -   **Event**: `catalog.new_product` -> Admin Review.

---

## 2. The Negotiation Flow (Complex)

### Scenario: User wants to buy "Running Shoes" listed at $150.
1.  **User Action**: Clicks "Negotiate" on Product Page.
2.  **System**:
    -   Checks if active `Negotiation` exists for (User, Shop, Product).
    -   If no, creates new `Negotiation` (Status: `OPEN`).
3.  **User Action**: Sends message: "Will you take $120?" with `offerPrice: 120`.
4.  **System (AI Interceptor)**:
    -   *Check*: Is `Shop.autoNegotiate` enabled? (Assume YES).
    -   *Logic*: Product Min Price is $130. Offer ($120) < Min ($130).
    -   *AI Decision*: Counter-offer.
    -   *AI Generation*: "That's a bit too low for these quality shoes. How about $135?"
5.  **System**:
    -   Saves `ChatMessage` (Sender: System/Shop).
    -   Updates `Negotiation` status.
6.  **User Action**: Sends: "Okay, $135 deal." with `offerPrice: 135`.
7.  **System (AI Interceptor)**:
    -   *Logic*: Offer ($135) >= Min ($130).
    -   *AI Decision*: Accept.
    -   *Action*: Update `Negotiation` status to `ACCEPTED`. Set `finalPrice = 135`.
    -   **Gap Fix**: We need to lock this price for the user.
    -   *System*: Generates a `signed_price_token` (JWT) containing `{ userId, productId, price: 135, exp: 24h }`.
8.  **User Action**: Clicks "Add to Cart" (from Chat).
9.  **System**:
    -   Adds item to Cart with `price: 135` and `negotiationId`.
    -   *Validation*: When adding to cart, system verifies `negotiationId` belongs to User and is `ACCEPTED`.

---

## 3. Order Fulfillment Flow (Delivery)

### A. Order Placement
1.  **User Action**: Checkout.
2.  **System**:
    -   Calculates Total (Price * Qty + Delivery Fee - Discount).
    -   Creates `Order` (Status: `PENDING`).
    -   Creates `Payment` record.
3.  **User Action**: Completes Payment (Stripe).
4.  **System**:
    -   Webhook receives `payment_success`.
    -   Updates `Order` status to `PENDING_SHOP_APPROVAL` (Gap Fix: Was just PENDING).
    -   **Event**: `order.created` -> Socket event to Shopkeeper.

### B. Shop Processing
1.  **Shopkeeper Action**: Accepts Order.
2.  **System**:
    -   Updates `Order` status to `ACCEPTED_BY_SHOP`.
    -   **Event**: `order.accepted` -> Notifies User.
    -   *Logic*: Triggers "Find Driver" workflow.

### C. Driver Assignment (The "Break" Fix: Race Conditions)
*Gap Identified*: What if two drivers accept the same order?
*Fix*: Use Redis atomic locks or `SETNX`.

1.  **System**: Finds active drivers within 5km radius (PostGIS query).
2.  **System**: Sends "New Order Request" to Driver A, B, C.
3.  **Driver A Action**: Swipes "Accept".
4.  **System**:
    -   *Redis Check*: `SET order:{id}:driver_lock "driverA" NX EX 30` (Atomic Lock).
    -   If success:
        -   Assign `Driver A` to `Order`.
        -   Update `Order` status to `DRIVER_ASSIGNED`.
        -   Notify Driver B & C: "Order taken".
    -   If fail (Driver B was faster):
        -   Show error to Driver A: "Order already accepted".

### D. Delivery & Completion
1.  **Driver Action**: Arrives at Shop. Verifies Order ID.
2.  **Shopkeeper Action**: Hands over package.
3.  **Driver Action**: Swipes "Picked Up".
4.  **System**: Updates `Order` status to `OUT_FOR_DELIVERY`.
5.  **Driver Action**: Arrives at User location.
6.  **User Action**: Provides "Delivery Code" (4-digit OTP).
    -   *Gap Fix*: We need a delivery code field in the Order model.
7.  **Driver Action**: Enters Code.
8.  **System**:
    -   Verifies Code.
    -   Updates `Order` status to `COMPLETED`.
    -   Transfers funds to Shop Wallet (minus commission).
    -   **Event**: `order.completed` -> Updates Leaderboard (Delivery Points).

---

## 4. Subscription Flow (SaaS Model)
1.  **Shopkeeper Action**: Selects "Premium Plan" (₹999/month).
2.  **System**:
    -   Creates `Package` record (Status: `PENDING`).
    -   Redirects to Payment Gateway (Stripe/Razorpay).
3.  **User Action**: Completes Payment.
4.  **System (Webhook)**:
    -   Updates `Package` status to `COMPLETED`.
    -   Creates/Updates `Subscription` record.
    -   Unlocks Premium Features (e.g., "Verified Badge", "Analytics").
    -   **Event**: `subscription.activated` -> Sends Invoice Email.

---

## 5. Gig Economy Flow (Mini-Jobs)
1.  **Shopkeeper Action**: Posts "Product Photography" Batch (Budget: ₹500).
2.  **System**:
    -   Creates `FreelancingBatch` (Status: `OPEN`).
    -   Notifies nearby users with "Photography" skill.
3.  **User (Gig Worker) Action**: Places Bid (₹450).
4.  **Shopkeeper Action**: Accepts Bid.
5.  **System**:
    -   Updates Batch status to `ASSIGNED`.
    -   Holds funds in Escrow (Payment Intent).
6.  **User Action**: Uploads photos.
7.  **Shopkeeper Action**: Approves work.
8.  **System**:
    -   Releases funds to User Wallet.
    -   Updates Batch status to `COMPLETED`.

---

## 6. Identified Gaps & Fixes

| Area | Gap Identified | Fix Applied to Docs |
|------|---------------|---------------------|
| **Negotiation** | How to enforce negotiated price in Cart? | Added `negotiationId` to Cart/Order and `signed_price_token` concept. |
| **Delivery** | Race condition on driver assignment. | Added Redis Atomic Lock strategy. |
| **Delivery** | Proof of delivery. | Added `deliveryCode` (OTP) to Order model. |
| **Shop** | Verification process. | Added `isVerified` flow and Admin approval step. |
| **Inventory** | When is stock deducted? | Stock is reserved on `Order Creation` (with 15m expiry) and committed on `Payment Success`. |
