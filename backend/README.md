# LocalBazaar Backend

E-commerce platform backend with AI-powered features, real-time negotiations, and delivery tracking.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (using Neon)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your actual values

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── modules/          # Feature modules (auth, users, shops, etc.)
│   ├── common/           # Shared utilities
│   ├── providers/        # External service integrations
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
└── package.json
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## 🗄️ Database

Using **Neon PostgreSQL** with:
- **PostGIS** for geospatial queries (shop locations, driver tracking)
- **pgvector** for semantic product search

### Schema Highlights
- 30+ models covering all features
- Complete relations and indexes
- Optimized for performance

## 📚 API Documentation

API runs on `http://localhost:5000`

### Health Check
```bash
GET /health
```

### API Base
```bash
GET /api/v1
```

Full API documentation coming soon...

## 🔧 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon) + PostGIS + pgvector
- **ORM**: Prisma
- **Validation**: Zod
- **Auth**: JWT + Argon2
- **Security**: Helmet + CORS

## 🌟 Features

- ✅ User authentication & authorization
- ✅ Shop management
- ✅ Product catalog with semantic search
- ✅ Real-time negotiations
- ✅ Order management
- ✅ Driver & delivery tracking
- ✅ Wallet & payments
- ✅ Reviews & ratings
- ✅ Notifications
- ✅ Admin moderation
- ✅ Gig economy features
- ✅ Subscriptions

## 📝 Environment Variables

See `.env.example` for required environment variables.

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

MIT

---

**Status**: 🚧 In Development
**Version**: 1.0.0
