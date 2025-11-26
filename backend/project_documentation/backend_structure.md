# Backend Architecture & Structure

## 1. Architectural Pattern: Modular Monolith
We will adopt a **Modular Monolith** architecture. This strikes the perfect balance between the simplicity of a monolith and the scalability of microservices.
- **Why?**: It allows us to keep code organized by *business domain* (e.g., Orders, Users, Shops) rather than technical layer (e.g., Controllers, Services). This makes future extraction into microservices easier if needed.

## 2. Directory Structure (Detailed)

```
backend/
├── src/
│   ├── app.ts                          # Express App setup (Middleware, Routes)
│   ├── server.ts                       # Entry point (Port listener, DB connection)
│   │
│   ├── config/                         # Configuration & Environment
│   │   ├── env.config.ts               # Zod-validated env variables
│   │   ├── database.config.ts          # Prisma/Postgres connection
│   │   ├── redis.config.ts             # Redis connection & client
│   │   └── logger.config.ts            # Winston/Pino logger setup
│   │
│   ├── common/                         # Shared Kernel (Used by all modules)
│   │   ├── constants/                  # Global constants (Roles, Statuses)
│   │   ├── decorators/                 # Custom decorators (if using NestJS)
│   │   ├── dtos/                       # Shared DTOs (Pagination, Search)
│   │   ├── errors/                     # Custom Error Classes (AppError, NotFound)
│   │   ├── interfaces/                 # Shared Interfaces (RequestWithUser)
│   │   ├── middlewares/                # Global Middlewares
│   │   │   ├── auth.middleware.ts      # JWT Verification
│   │   │   ├── error.middleware.ts     # Global Error Handler
│   │   │   ├── rate-limit.middleware.ts
│   │   │   └── validation.middleware.ts # Zod/Joi Validator
│   │   └── utils/                      # Helper functions
│   │       ├── api-response.util.ts    # Standardized API Response wrapper
│   │       ├── date.util.ts
│   │       └── password.util.ts        # Bcrypt/Argon2 wrappers
│   │
│   ├── modules/                        # Business Domains (The Core)
│   │   ├── auth/                       # Authentication Module
│   │   │   ├── auth.controller.ts      # Handle HTTP Requests
│   │   │   ├── auth.service.ts         # Business Logic
│   │   │   ├── auth.repository.ts      # DB Access (Prisma calls)
│   │   │   ├── auth.routes.ts          # Route Definitions
│   │   │   └── dtos/                   # Input Validation Schemas
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── users/                      # User Management
│   │   ├── shops/                      # Shop & Inventory Management
│   │   ├── products/                   # Product Catalog (Master & Shop)
│   │   ├── orders/                     # Order Processing & Cart
│   │   │   ├── order.service.ts        # Handles delivery code verification
│   │   │   └── cart.service.ts         # Validates signed_price_token
│   │   ├── negotiations/               # Chat & Bargaining Logic
│   │   │   └── negotiation.service.ts  # Generates signed_price_token on acceptance
│   │   ├── billing/                    # Subscriptions & Payments
│   │   │   ├── billing.service.ts      # Plan management
│   │   │   └── payment.orchestrator.ts # Orchestrates Payment + Order + Subscription
│   │   ├── gamification/               # Leaderboards & Rewards
│   │   │   ├── leaderboard.service.ts
│   │   │   └── leaderboard.repository.ts
│   │   ├── gig/                        # Freelancing/Mini-jobs
│   │   │   ├── gig.service.ts
│   │   │   ├── bid.service.ts
│   │   │   └── gig.repository.ts
│   │   ├── catalog/                    # Global Product Catalog
│   │   │   ├── master-product.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── brand.service.ts
│   │   │   └── catalog.repository.ts
│   │   ├── notifications/              # Push & In-App Notifications
│   │   │   ├── notification.service.ts # Send notifications
│   │   │   ├── notification.repository.ts
│   │   │   └── fcm.provider.ts         # Firebase Cloud Messaging
│   │   ├── reports/                    # User Reports & Moderation
│   │   │   ├── report.service.ts       # Create/resolve reports
│   │   │   ├── report.controller.ts    # Admin endpoints
│   │   │   └── report.repository.ts
│   │   ├── mandi/                      # Market Prices
│   │   │   ├── mandi.service.ts        # Fetch & store prices
│   │   │   ├── mandi.repository.ts
│   │   │   └── agmarknet.provider.ts   # External API integration
│   │   ├── delivery/                   # Driver & Logistics
│   │   │   ├── driver.service.ts
│   │   │   ├── delivery.orchestrator.ts
│   │   │   └── driver.repository.ts
│   │   └── analytics/                  # Dashboards & Reporting
│   │       ├── analytics.service.ts
│   │       └── metrics.repository.ts
│   │
│   ├── providers/                      # External Service Adapters
│   │   ├── email/                      # Email Service (SendGrid/AWS SES)
│   │   ├── payment/                    # Payment Gateway (Stripe/Razorpay)
│   │   ├── storage/                    # File Storage (S3/Cloudinary)
│   │   ├── maps/                       # Google Maps / Mapbox
│   │   ├── sms/                        # Twilio / MSG91
│   │   └── ai/                         # AI Service Client (Python Bridge)
│   │
│   └── jobs/                           # Background Workers (BullMQ)
│       ├── definitions/                # Job Processors
│       │   ├── email.processor.ts
│       │   └── image-resize.processor.ts
│       └── queues.ts                   # Queue Setup
│
├── prisma/
│   ├── schema.prisma                   # Database Schema
│   ├── migrations/                     # SQL Migrations
│   └── seed.ts                         # Database Seeder
│
├── tests/                              # Testing Strategy
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## 3. Design Patterns & Best Practices

### A. Controller-Service-Repository Pattern
We strictly separate concerns to ensure maintainability.
1.  **Controller**:
    -   **Responsibility**: Parse HTTP requests, validate input (DTOs), call Services, send HTTP responses.
    -   **Rule**: NO business logic here. NO database calls here.
2.  **Service**:
    -   **Responsibility**: Contains ALL business logic. Validates rules (e.g., "User cannot order from closed shop"). Calls Repositories.
    -   **Rule**: Framework agnostic. Should not know about HTTP (req/res).
3.  **Repository**:
    -   **Responsibility**: Direct database interaction (Prisma/SQL).
    -   **Rule**: Only place where DB queries exist.
4.  **Orchestrator (Optional)**:
    -   **Responsibility**: Coordinates complex flows involving multiple services (e.g., "Purchase Subscription" -> Payment + Update Shop + Send Email).
    -   **Why?**: Prevents circular dependencies between Services.

### B. Dependency Injection (DI)
Even without a framework like NestJS, we will use manual DI or a lightweight container (like `tsyringe`) to inject dependencies. This makes testing easier (we can mock the Repository when testing the Service).

### C. Error Handling
-   **Global Error Handler**: A centralized middleware to catch all errors.
-   **AppError Class**: A custom class extending `Error` with `statusCode` and `isOperational` flags.
-   **Result Pattern**: (Optional) Return `Result.ok(value)` or `Result.fail(error)` instead of throwing exceptions for expected business failures.

### D. Validation
-   **Zod**: We will use Zod for runtime schema validation of all incoming requests (Body, Query, Params).
-   **Strict Typing**: TypeScript `strict: true` is mandatory. No `any`.

## 4. Key Technologies Implementation
    ```json
    {
      "success": true,
      "message": "Operation successful",
      "data": { ... },
      "meta": { "page": 1, "limit": 10, "total": 100 } // For lists
    }
    ```
