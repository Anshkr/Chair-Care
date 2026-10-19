# ChairCare — Complete Deployment, Backend & Production Guide

This guide contains all verified instructions and commands for running the ChairCare full-stack platform (Frontend + Node.js/TypeScript Backend + Neon PostgreSQL) on your local development machine and preparing for company server deployment.

---

## 1. Environment & Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│                       LOCAL DEVELOPMENT ENVIRONMENT                       │
│                                                                           │
│  ┌───────────────────────────────┐     ┌───────────────────────────────┐  │
│  │       FRONTEND (Expo/RN)      │     │      BACKEND (Node/Express)   │  │
│  │   Port: 8081 (Web/Metro)      │────▶│   Port: 4000 (/api/v1)        │  │
│  │   Config: EXPO_PUBLIC_API_URL │     │   Language: TypeScript        │  │
│  └───────────────────────────────┘     └───────────────┬───────────────┘  │
└────────────────────────────────────────────────────────┼──────────────────┘
                                                         │ SSL Connection
                                                         ▼
                                          ┌───────────────────────────────┐
                                          │     NEON POSTGRESQL CLOUD     │
                                          │   Connection: DATABASE_URL    │
                                          │   SSL: sslmode=require        │
                                          │   Auto-scaling & branching    │
                                          └───────────────────────────────┘
```

> [!IMPORTANT]
> **Personal Machine vs Company Server:**
> - Development and local testing run directly on your current machine.
> - **Neon PostgreSQL** is used for the database layer with encrypted SSL connections.
> - The company server is the eventual production deployment target to be deployed later.

---

## 2. Backend Setup & Local Startup

### 2.1 Backend Directory Location
```bash
cd d:/OffhemanProjects/Chair-Service-platform/ChairCare/backend
```

### 2.2 Environment Configuration (`.env`)
Create `.env` in `ChairCare/backend/` using the provided `.env.example`:

```env
# Server
PORT=4000
NODE_ENV=development

# Neon PostgreSQL Connection URL (Obtain from your Neon console)
DATABASE_URL=postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# JWT Secret (Generate a strong random 32+ character string)
JWT_SECRET=chaircare_super_secure_jwt_secret_development_key_987654321

# CORS & Gateway
CORS_ORIGIN=*
PAYMENT_GATEWAY_ENV=sandbox
```

### 2.3 Install Backend Dependencies
```bash
npm install
```

### 2.4 Run Database Migrations & Seeds
```bash
# Run database schema migrations (idempotent, safe to rerun)
npm run migrate

# Seed initial service catalogue, test customer, technician, and admin accounts
npm run seed
```

### 2.5 Start Backend Server
```bash
# Development mode with hot-reloading (ts-node):
npm run dev

# Production build and run:
npm run build
npm start
```

### 2.6 Verify Backend Health
```bash
# Test health endpoint (should return 200 OK):
curl http://localhost:4000/health

# Run compiled verification test suite:
node tests/compiledRunner.js
```

---

## 3. Frontend Setup & Local Startup

### 3.1 Frontend Directory Location
```bash
cd d:/OffhemanProjects/Chair-Service-platform/ChairCare
```

### 3.2 Frontend Environment Configuration
Optionally configure `EXPO_PUBLIC_API_URL` in `.env` or system environment:
```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
```
*(If omitted, the centralized API client defaults to `http://localhost:4000/api/v1`)*

### 3.3 Start Frontend Application
```bash
# Start Metro bundler (Interactive menu for Web, Android, iOS)
npm start

# Open Web application directly in default browser:
npm run web

# Open in connected Android device/emulator:
npm run android
```

### 3.4 Frontend Quality Checks
```bash
# Run TypeScript type validation:
npm run type-check

# Check Expo configuration:
npx expo config --type public

# Test production web export:
npm run build:web
npm run preview:web
```

---

## 4. API Endpoints & Role Access Summary

All endpoints are versioned under `/api/v1`:

### Public / Authentication Endpoints
| Endpoint | Method | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Public | System and server health status |
| `/api/v1/auth/register` | `POST` | Public | Create new customer or technician account |
| `/api/v1/auth/login` | `POST` | Public | Authenticate user and issue JWT token |
| `/api/v1/auth/me` | `GET` | Bearer Token | Get current user profile and role details |
| `/api/v1/services` | `GET` | Public | List all active repair services in catalog |
| `/api/v1/services/:id` | `GET` | Public | Get single service details and price |

### Customer Endpoints
| Endpoint | Method | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/customer/requests` | `POST` | Customer | Book chair repair request (creates tracking code) |
| `/api/v1/customer/requests` | `GET` | Customer | List all requests belonging to authenticated customer |
| `/api/v1/customer/requests/:id`| `GET` | Customer/Admin | Get detailed status history & technician info |
| `/api/v1/customer/requests/:id/cancel` | `POST` | Customer | Cancel eligible service request |
| `/api/v1/customer/reviews` | `POST` | Customer | Submit 1–5 star review after service completion |

### Technician Endpoints
| Endpoint | Method | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/technician/jobs` | `GET` | Technician | View assigned jobs or open broadcast jobs in zone |
| `/api/v1/technician/availability` | `POST` | Technician | Toggle online/offline status and current zone |
| `/api/v1/technician/jobs/:id/accept` | `POST` | Technician | Accept an unassigned job broadcast |
| `/api/v1/technician/jobs/:id/status` | `PATCH` | Technician | Advance status (`in_route` ➔ `arrived` ➔ `in_progress` ➔ `completed`) |
| `/api/v1/technician/earnings` | `GET` | Technician | View today's & weekly earnings from completed jobs |

### Super Admin Endpoints
| Endpoint | Method | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/dashboard` | `GET` | Admin | Live metrics (revenue, active jobs, online techs) |
| `/api/v1/admin/requests` | `GET` | Admin | Paginated list of all customer requests |
| `/api/v1/admin/technicians` | `GET` | Admin | List all registered technicians and status |
| `/api/v1/admin/technicians/:id/verify` | `PATCH` | Admin | Verify, reject, or suspend technician account |
| `/api/v1/admin/requests/:id/assign` | `POST` | Admin | Manually dispatch technician to request |
| `/api/v1/admin/payments` | `GET` | Admin | View transaction logs and payment records |

---

## 5. Future Company Server Deployment Guide

When the company Linux production server is provisioned, follow these production deployment steps:

### 5.1 Backend Deployment (PM2 Process Manager)

1. **Install Node.js 20+ & PM2 on company server:**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm
   sudo npm install -g pm2
   ```

2. **Clone / Copy backend to server:**
   ```bash
   mkdir -p /var/www/chaircare-backend
   cd /var/www/chaircare-backend
   # Copy backend files or pull via git
   npm install --production
   npm run build
   ```

3. **Configure production environment:**
   Create `/var/www/chaircare-backend/.env` with production `DATABASE_URL` and `JWT_SECRET`.

4. **Start and persist with PM2:**
   ```bash
   pm2 start dist/server.js --name "chaircare-api" -i max
   pm2 save
   pm2 startup
   ```

### 5.2 Nginx Reverse Proxy & SSL Configuration

Create `/etc/nginx/sites-available/chaircare.conf`:

```nginx
# 1. API Reverse Proxy
server {
    listen 80;
    server_name api.chaircare.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 2. Frontend Web Static SPA
server {
    listen 80;
    server_name app.chaircare.com;

    root /var/www/chaircare-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable HTTPS via Let's Encrypt:
```bash
sudo certbot --nginx -d api.chaircare.com -d app.chaircare.com
```

---

## 6. Database Backups, Migrations & Rollback

- **Neon Cloud Backups:** Neon provides automatic point-in-time recovery (PITR) and instant database branch backups from the Neon Console.
- **Manual Logical Backup (pg_dump):**
  ```bash
  pg_dump "$DATABASE_URL" -F c -b -v -f "chaircare_backup_$(date +%Y%m%d).dump"
  ```
- **Manual Restore:**
  ```bash
  pg_restore -d "$DATABASE_URL" -v "chaircare_backup_20261010.dump"
  ```
- **Migration Tracking:** All applied migrations are tracked in the `_migrations` database table and are fully idempotent.
