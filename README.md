# ChairCare Mobile App & Backend Setup Guide 🪑⚡
> **Self-Hosted Backend, Database Setup & Mobile App (Android/iOS) Installation Guide**

This guide provides instructions for setting up the **ChairCare Backend API**, provisioning the **PostgreSQL Database**, and configuring & building the **Mobile App** (React Native / Expo) to connect directly to your server.

---

## 📋 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Where to Change Code to Connect Database & App](#2-where-to-change-code-to-connect-database--app)
3. [How to Create & Migrate the Database (Which Files to Run)](#3-how-to-create--migrate-the-database-which-files-to-run)
4. [Backend Server Setup & Running in Production](#4-backend-server-setup--running-in-production)
5. [Mobile App Setup & Building Standalone Android APK](#5-mobile-app-setup--building-standalone-android-apk)
6. [Default Pre-Seeded Accounts for Testing](#6-default-pre-seeded-accounts-for-testing)
7. [Troubleshooting & Verification](#7-troubleshooting--verification)

---

## 1. Architecture Overview

The system consists of two parts:
- **Backend API & Database (Hosted on your Server)**: Node.js + Express + TypeScript connecting to a PostgreSQL database on port `5432`. Serves REST API endpoints on port `5000` (e.g. `http://YOUR_SERVER_IP:5000/api/v1`).
- **Mobile Application (Installed on Mobile Phones)**: Cross-platform React Native / Expo application installed on Android or iOS devices. Communicates with your server over HTTP/HTTPS.

```
┌────────────────────────────────┐         REST API Calls (JSON)
│   Mobile App (Android / iOS)   │ ────────────────────────────────────────┐
│  Installed on Technician /     │                                         │
│  Customer Mobile Devices       │                                         │
└────────────────────────────────┘                                         ▼
                                                         ┌──────────────────────────────────┐
                                                         │   Backend Server (Node.js API)   │
                                                         │   Port 5000                      │
                                                         │   File: backend/src/server.ts    │
                                                         └────────────────┬─────────────────┘
                                                                          │ Pooled SQL Queries
                                                                          │ (backend/src/config/database.ts)
                                                                          ▼
                                                         ┌──────────────────────────────────┐
                                                         │   PostgreSQL Relational DB       │
                                                         │   Port 5432                      │
                                                         │   Migrations 001 through 018     │
                                                         └──────────────────────────────────┘
```

---

## 2. Where to Change Code to Connect Database & App

There are only **two configuration files** where you need to input your server's connection details:

### A. Connecting Database to Backend Code
- **Configuration File**: `backend/.env`
- **Underlying Code Files**:
  - [`backend/src/config/env.ts`](backend/src/config/env.ts) reads `process.env.DATABASE_URL`.
  - [`backend/src/config/database.ts`](backend/src/config/database.ts) creates the `pg.Pool` connection pool using this string.

#### Where & What to Change:
Open `backend/.env` (or copy from `backend/.env.example`):
```env
# 1. Set your PostgreSQL connection URL
# Format: postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?sslmode=<prefer|require|disable>

# Example for Local PostgreSQL running on the same server:
DATABASE_URL="postgresql://chaircare_user:YourStrongPassword123!@localhost:5432/chaircare?sslmode=disable"

# Example for Cloud PostgreSQL (e.g. Neon, Supabase, or AWS RDS):
# DATABASE_URL="postgresql://username:password@ep-your-project.region.aws.neon.tech/neondb?sslmode=require"

# 2. JWT Secret for token signing (Enter any random 32+ character string)
JWT_SECRET=your_super_secret_jwt_random_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# 3. Server Port
PORT=5000
NODE_ENV=production
CORS_ORIGIN=*

# 4. Payment Gateway (Optional - if left blank, app runs in safe Simulator Mode)
PAYMENT_GATEWAY_ENV=sandbox
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

---

### B. Connecting Mobile App to Backend API
- **Configuration File**: `ChairCare/.env` (Root directory of frontend)
- **Underlying Code File**:
  - [`src/services/api/apiClient.ts`](src/services/api/apiClient.ts) reads `process.env.EXPO_PUBLIC_API_URL` to route all requests from customer and technician phones to your server.

#### Where & What to Change:
Open `.env` in the root `ChairCare/` folder (or copy from `.env.example`):
```env
# Point this to your backend server IP address or domain:
EXPO_PUBLIC_API_URL=http://YOUR_SERVER_IP:5000/api/v1

# Or if you have configured a domain with SSL:
# EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api/v1

# Razorpay Client Public Key (Optional - leave blank for Simulator Mode)
EXPO_PUBLIC_RAZORPAY_KEY_ID=
```

---

## 3. How to Create & Migrate the Database (Which Files to Run)

The database schema, tables, and seed catalogs are created automatically by running the backend migration and seed scripts.

### Step 3.1: Create the Empty Database in PostgreSQL
On your server or local machine running PostgreSQL:

```bash
# 1. Open PostgreSQL shell
sudo -u postgres psql
```

Execute these SQL commands:
```sql
-- Create the database
CREATE DATABASE chaircare;

-- Create dedicated database user
CREATE USER chaircare_user WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE chaircare TO chaircare_user;
ALTER DATABASE chaircare OWNER TO chaircare_user;

-- Exit psql
\q
```

---

### Step 3.2: Which Files Run to Create Tables (Migrations)
- **Script Executed**: `npm run migrate`
- **Runner File**: [`backend/src/migrations/runMigrations.ts`](backend/src/migrations/runMigrations.ts)
- **SQL Files Applied**: All files inside `backend/src/migrations/` sequentially:
  - `001_initial_schema.sql` (Creates `users`, `services`, `service_requests`, `payments`, `reviews`)
  - `002_notification_system.sql` (Notification delivery preferences)
  - `003_chat_system.sql` (In-app customer/technician chat messages)
  - `004` to `016` (Security OTP PIN, photo logs, repair timers, dispatch rules)
  - `017_platform_fee_rules.sql` (10% dynamic platform fee & rate card configuration)
  - `018_technician_upi_qr.sql` (Technician direct UPI ID `upi_id` and linked `upi_phone` for on-site QR payments)

Run this command inside the `backend/` directory:
```bash
cd backend
npm install
npm run migrate
```
**Expected Terminal Output:**
```
🚀 [Migrations] Starting database schema migrations...
  ▶ Executing migration: 001_initial_schema.sql ... ✅ [OK]
  ▶ Executing migration: 002_notification_system.sql ... ✅ [OK]
  ...
  ▶ Executing migration: 017_platform_fee_rules.sql ... ✅ [OK]
  ▶ Executing migration: 018_technician_upi_qr.sql ... ✅ [OK]
✨ [Migrations] All database migrations applied successfully!
```

---

### Step 3.3: Which File Runs to Populate Initial Data (Seeds)
- **Script Executed**: `npm run seed`
- **Seed File**: [`backend/src/seeds/seedDevData.ts`](backend/src/seeds/seedDevData.ts)
- **What it Populates**:
  - The **8 core chair repair services** (Hydraulic Gas Lift Fix, Tilt Mechanism Overhaul, Wheel Castor Fix, 3D Armrest Pads, Ergonomic Sanitization, etc.).
  - Default rate card prices and durations.
  - Initial testing accounts for **SuperAdmin**, **Technician**, and **Customer**.

Run this command inside the `backend/` directory:
```bash
npm run seed
```
**Expected Terminal Output:**
```
🌱 [Seed]: Seeding initial catalog and demo accounts...
  ✅ Seeded 8 core ergonomic repair services
  ✅ Seeded SuperAdmin: admin@chaircare.com
  ✅ Seeded Technician: technician@chaircare.com
  ✅ Seeded Customer: customer@chaircare.com
✨ [Seed]: Database initialized successfully!
```

---

## 4. Backend Server Setup & Running in Production

To keep your backend API running 24/7 on your server with automated restarts, use **PM2**:

```bash
cd /path/to/ChairCare/backend

# 1. Install production dependencies
npm install

# 2. Compile TypeScript to JavaScript (dist/ folder)
npm run build

# 3. Install PM2 globally if not installed
sudo npm install -g pm2

# 4. Start backend API service
pm2 start dist/server.js --name "chaircare-backend"

# 5. Enable auto-restart on system reboot
pm2 save
pm2 startup

# 6. Verify server health
curl http://localhost:5000/api/v1/health
```

---

## 5. Mobile App Setup & Building Standalone Android APK

You do not need any web build. You can run the mobile application directly on mobile phones in two ways:

### Method A: Immediate Testing on Phones via Expo Go (Fastest)
1. Install the free **Expo Go** app from the Google Play Store or Apple App Store on your phone.
2. In the root `ChairCare/` folder on your computer:
   ```bash
   cd ChairCare
   npm install
   npx expo start
   ```
3. A large QR code will appear in your terminal.
4. Open the camera or **Expo Go** app on your phone and scan the QR code.
5. The full ChairCare app will load and run natively on your phone, connecting to your server!

---

### Method B: Building a Standalone Installable Android APK (`.apk`)
To create a standalone `.apk` file that your team or technicians can install directly onto Android devices without Expo Go:

1. Create a free account at [expo.dev](https://expo.dev).
2. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
3. Log in inside the `ChairCare/` root directory:
   ```bash
   eas login
   ```
4. Configure EAS build (already configured in `eas.json`):
   ```bash
   eas build:configure
   ```
5. Trigger the standalone Android APK build:
   ```bash
   eas build -p android --profile preview
   ```
6. EAS will build the APK in the cloud. Once complete, it outputs a direct download link (e.g. `https://expo.dev/artifacts/eas/...apk`).
7. Download and install the `.apk` on any Android device.

---

## 6. Default Pre-Seeded Accounts for Testing

After executing `npm run seed`, you can log in to the mobile app immediately using any of these roles:

| Role | Email Login | Default Password | Features Accessible in App |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@chaircare.com` | `Password@123` | Operations Command, Live Dispatch Control, KYC Verification, Rate Cards & Platform Fee Rules |
| **Field Technician** | `technician@chaircare.com` | `Password@123` | Real-time Job Queue, On-site Repair Timer, OTP Verification, Direct Customer UPI QR Codes, Earnings Ledger |
| **Customer** | `customer@chaircare.com` | `Password@123` | 5-Step Ergonomic Repair Booking, Live GPS Technician Tracking, Digital Tax Invoices, Dispute Filing |

> **Dev Tip**: You can also switch between roles instantly inside the mobile app using the floating **Dev Role Switcher** button.

---

## 7. Troubleshooting & Verification

### 1. Database Connection Check
To verify your server connects to PostgreSQL:
```bash
cd backend
node -e "require('dotenv').config(); const { Pool } = require('pg'); const p = new Pool({ connectionString: process.env.DATABASE_URL }); p.query('SELECT NOW()').then(r => { console.log('Connected to DB at:', r.rows[0].now); p.end(); }).catch(e => console.error('Connection failed:', e.message));"
```

### 2. Firewall Port Access
If your mobile phone cannot reach the backend API, ensure port `5000` is open on your server firewall:
```bash
sudo ufw allow 5000/tcp
sudo ufw reload
```

### 3. Checking Server Logs
```bash
# View live backend logs
pm2 logs chaircare-backend

# Check service status
pm2 status
```

---

## 📞 Support & Contacts
- **Helpline Phone**: `+91 92174 60742`
- **Email**: `enquiry@offheman.in`
- **Technical Reference**: See [`ChairCare_Developer_Codebase_Reference.pdf`](ChairCare_Developer_Codebase_Reference.pdf) for complete file-by-file code architecture.

## 💻 Developers
- **Ansh & Smruthi**
