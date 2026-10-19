# ChairCare Backend API (Node.js + TypeScript + Express + Neon PostgreSQL)

The backend service for ChairCare chair repair & ergonomic service marketplace platform.

---

## 1. Quick Start Guide

### Prerequisites
- Node.js 18+ or 20+
- Neon PostgreSQL database instance

### Installation
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and paste your Neon DATABASE_URL:
# DATABASE_URL=postgresql://user:password@ep-sample.region.aws.neon.tech/neondb?sslmode=require
```

### Database Migrations & Seeds
```bash
# Apply schema migrations to Neon PostgreSQL
npm run migrate

# Populate services catalog and sample accounts (Customer, Tech, Admin)
npm run seed
```

### Running Locally
```bash
# Development server with hot reload:
npm run dev

# Or build & start production bundle:
npm run build
npm start
```

---

## 2. API Health & Verification

- **API & DB Health Check:** `http://localhost:5000/api/health`
- **Root Health Check:** `http://localhost:5000/health`
- **Versioned Root:** `http://localhost:5000/api/v1`

### Running Automated Test Suites
```bash
# 1. Run Unit & RBAC verification tests on built dist:
node tests/compiledRunner.js

# 2. Run Live Neon Database Integration tests:
node tests/liveNeonIntegration.js
```

---

## 3. Seeded Accounts (Development Mode)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Customer** | `customer@chaircare.com` | `Password@123` |
| **Technician** | `technician@chaircare.com` | `Password@123` |
| **Super Admin** | `admin@chaircare.com` | `Password@123` |

---

## 4. API Endpoints Overview

- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/login` — Login & receive JWT
- `GET  /api/v1/auth/me` — Authenticated profile details
- `GET  /api/v1/services` — Public services catalog
- `POST /api/v1/customer/requests` — Book chair repair request
- `GET  /api/v1/customer/requests` — Customer's request history
- `GET  /api/v1/technician/jobs` — Technician job board
- `PATCH /api/v1/technician/jobs/:id/status` — Advance service status
- `GET  /api/v1/admin/dashboard` — Live operations metrics
- `GET  /api/v1/admin/technicians` — Technician verification management
