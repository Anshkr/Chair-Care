# ChairCare Platform — Client Self-Hosted Server Setup & Deployment Guide 🪑⚡

Welcome to the **ChairCare Platform** deployment guide. This document provides step-by-step instructions for your technical team or systems administrator to install, configure, and host the entire ChairCare platform (backend API, PostgreSQL database, and frontend web/mobile client) completely from scratch on your own dedicated or cloud server (e.g. AWS EC2, DigitalOcean, Hetzner, Linode, or on-premise Linux server).

---

## 📋 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [What & Where Changes Need to Be Made](#2-what--where-changes-need-to-be-made)
3. [Credentials & Security Configuration](#3-credentials--security-configuration)
4. [Server Prerequisites & Hardware Sizing](#4-server-prerequisites--hardware-sizing)
5. [Step-by-Step Installation From Scratch](#5-step-by-step-installation-from-scratch)
   - [Step 5.1: Operating System & Dependency Setup](#step-51-operating-system--dependency-setup)
   - [Step 5.2: PostgreSQL Database Setup & Migrations](#step-52-postgresql-database-setup--migrations)
   - [Step 5.3: Backend API Setup & PM2 Process Management](#step-53-backend-api-setup--pm2-process-management)
   - [Step 5.4: Frontend Client Web Build](#step-54-frontend-client-web-build)
   - [Step 5.5: Nginx Reverse Proxy & SSL Setup](#step-55-nginx-reverse-proxy--ssl-setup)
   - [Step 5.6: Native Mobile Android APK Build](#step-56-native-mobile-android-apk-build)
6. [Default Pre-Configured Seed Accounts](#6-default-pre-configured-seed-accounts)
7. [System Maintenance & Backups](#7-system-maintenance--backups)

---

## 1. Architecture Overview

The ChairCare platform consists of three decoupled components:
- **Backend REST API**: Node.js 20, Express, TypeScript, and JSON Web Token (JWT) role-based authentication.
- **Relational Database**: PostgreSQL (version 14+) with automatic sequential migrations (`001` to `018`) and seed catalogs.
- **Client Application**: Cross-platform React Native / Expo application built for Web (desktop/mobile browsers) and native Android/iOS.

```
                    ┌─────────────────────────┐
                    │    End Users & Fleet    │
                    │ (Web, Android, iOS App) │
                    └────────────┬────────────┘
                                 │ HTTPS (Port 443)
                                 ▼
                    ┌─────────────────────────┐
                    │      Nginx Proxy        │
                    │   (SSL via Let's Encrypt)│
                    └─────┬─────────────┬─────┘
                          │             │
        Static Web Bundle │             │ Reverse Proxy /api/v1
    (/var/www/chaircare)  │             │ (http://127.0.0.1:5000)
                          ▼             ▼
                   [ Web Assets ]   ┌──────────────────────────┐
                                    │ ChairCare Backend API    │
                                    │ (Node.js / PM2 Process)  │
                                    └────────────┬─────────────┘
                                                 │ Pooled Connection (Port 5432)
                                                 ▼
                                    ┌──────────────────────────┐
                                    │ PostgreSQL Relational DB │
                                    │ (Self-Hosted / Managed)  │
                                    └──────────────────────────┘
```

---

## 2. What & Where Changes Need to Be Made

Before launching on your own server, review the configuration files below and adjust them to your domain, database, and payment keys:

| Component | Target File | What Needs to Be Changed | Description |
| :--- | :--- | :--- | :--- |
| **Backend** | `backend/.env` | `DATABASE_URL` | Set your PostgreSQL username, password, host, and database name. |
| **Backend** | `backend/.env` | `JWT_SECRET` | Generate a strong, private 32+ character random string for token signing. |
| **Backend** | `backend/.env` | `PORT` | HTTP port for Node.js API (Default: `5000`). |
| **Backend** | `backend/.env` | `CORS_ORIGIN` | Set your client domain(s) (e.g. `https://yourdomain.com`). Set `*` during initial testing. |
| **Backend** | `backend/.env` | `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` | Insert your own Razorpay Merchant API keys (Leave blank to run in sandbox simulation mode). |
| **Frontend** | `.env` | `EXPO_PUBLIC_API_URL` | Point to your backend endpoint (e.g. `https://api.yourdomain.com/api/v1` or `http://YOUR_SERVER_IP:5000/api/v1`). |
| **Frontend** | `.env` | `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Your public Razorpay Key ID (Client-side, e.g. `rzp_live_...` or `rzp_test_...`). |
| **Branding/Helpdesk** | `src/screens/customer/BookingStep5...` & `TechnicianProfile...` | Support phone & email | Currently set to `+91 92174 60742` and `enquiry@offheman.in`. Change if you have your own support desk. |
| **Web Server** | `/etc/nginx/sites-available/chaircare` | Domain names & paths | Bind your domain name and SSL certificates in Nginx. |

---

## 3. Credentials & Security Configuration

> [!IMPORTANT]
> **All developer credentials have been completely decoupled from the source code.**
> - Previous hardcoded test/live Razorpay keys have been purged from the client components.
> - The application now resolves all secrets strictly from runtime environment variables (`.env`).
> - If Razorpay keys are omitted, the platform automatically boots in a safe **Sandbox Simulator Mode** allowing you to test bookings, payments, and settlements without charging real cards or UPI accounts.

### How to Generate Your Production Secrets:
1. **JWT Secret**: Generate a secure 64-character secret by running:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **Database Password**: Create a strong password for your PostgreSQL `chaircare_user`.
3. **Razorpay Keys**: Obtain your live or test keys from [Razorpay Dashboard](https://dashboard.razorpay.com/) > **Settings** > **API Keys**.

---

## 4. Server Prerequisites & Hardware Sizing

### Minimum Recommended Server Specs:
- **Operating System**: Ubuntu 22.04 LTS or 24.04 LTS (x86_64 or ARM64)
- **RAM**: 2 GB minimum (4 GB recommended if building frontend on server)
- **CPU**: 2 vCPUs
- **Storage**: 25 GB SSD or NVMe
- **Network**: Static public IPv4 address with ports `80`, `443`, and `22` open.

---

## 5. Step-by-Step Installation From Scratch

### Step 5.1: Operating System & Dependency Setup

Connect to your server via SSH as `root` or a `sudo` user:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install essential build tools & Git
sudo apt install -y curl wget git build-essential ufw nginx certbot python3-certbot-nginx

# 3. Install Node.js 20 LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Verify Node & NPM versions
node -v   # Should be v20.x.x
npm -v    # Should be v10.x.x

# 5. Install PM2 (Process Manager for production Node.js)
sudo npm install -g pm2
```

---

### Step 5.2: PostgreSQL Database Setup & Migrations

You can use either a **local PostgreSQL instance** on the same server or a **cloud managed database** (like Neon, Supabase, or AWS RDS).

#### Option A: Installing Local PostgreSQL on Server
```bash
# 1. Install PostgreSQL and contrib package
sudo apt install -y postgresql postgresql-contrib

# 2. Switch to postgres user and open PostgreSQL shell
sudo -u postgres psql
```

Inside the PostgreSQL prompt (`psql`), execute:
```sql
-- Create database
CREATE DATABASE chaircare;

-- Create dedicated user with strong password
CREATE USER chaircare_user WITH ENCRYPTED PASSWORD 'YourStrongPasswordHere123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE chaircare TO chaircare_user;
ALTER DATABASE chaircare OWNER TO chaircare_user;

-- Exit psql
\q
```

*Your database connection URL will be:*
`postgresql://chaircare_user:YourStrongPasswordHere123!@localhost:5432/chaircare?sslmode=disable`

---

#### Option B: Cloning the Codebase & Running Migrations
```bash
# 1. Clone repository to your web application directory
cd /var/www
git clone <YOUR_REPOSITORY_URL> chaircare-platform
cd chaircare-platform/ChairCare
```

Now configure the backend `.env`:
```bash
cd backend
cp .env.example .env
nano .env
```

Paste your configuration:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://chaircare_user:YourStrongPasswordHere123!@localhost:5432/chaircare?sslmode=disable"
JWT_SECRET=your_generated_jwt_secret_at_least_32_chars_long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=15

# Razorpay (Leave blank for Simulator Mode or add your credentials)
PAYMENT_GATEWAY_ENV=production
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Install backend dependencies and run database migrations:
```bash
# Install dependencies
npm install

# Run database schema migrations (Applies migrations 001 through 018)
npm run migrate

# Seed initial services, pricing rate cards, and demo accounts
npm run seed
```

> **Note**: `npm run migrate` will sequentially create all platform tables including user accounts, service catalogs, orders, payments, technician KYC, and dynamic UPI columns (`upi_id`, `upi_phone`).

---

### Step 5.3: Backend API Setup & PM2 Process Management

Compile TypeScript and start the backend service using PM2 for automated restarts, error recovery, and zero-downtime execution:

```bash
# Build TypeScript to production JavaScript (dist/)
npm run build

# Start backend application with PM2
pm2 start dist/server.js --name "chaircare-backend"

# Configure PM2 to start automatically on server reboot
pm2 save
pm2 startup
# (Run the sudo env command outputted by the terminal if prompted)

# Verify backend health
curl http://localhost:5000/api/v1/health
# Expected Output: {"status":"healthy",...}
```

---

### Step 5.4: Frontend Client Web Build

Now configure and build the production frontend web bundle:

```bash
cd /var/www/chaircare-platform/ChairCare

# 1. Create client .env file
cp .env.example .env
nano .env
```

Set your backend endpoint:
```env
# If using a domain:
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api/v1

# Or if using direct Server IP:
# EXPO_PUBLIC_API_URL=http://YOUR_SERVER_IP:5000/api/v1

# Razorpay Client Key ID (Optional - leave blank for Simulator)
EXPO_PUBLIC_RAZORPAY_KEY_ID=
```

Now install client dependencies and export the optimized static bundle:
```bash
# Install frontend dependencies
npm install

# Build static web distribution
npm run build:web
```
*This command exports the production static assets to `/var/www/chaircare-platform/ChairCare/dist`.*

---

### Step 5.5: Nginx Reverse Proxy & SSL Setup

Create an Nginx server block to serve the frontend web application and securely route API calls to the Node.js backend:

```bash
sudo nano /etc/nginx/sites-available/chaircare
```

Paste the following production Nginx configuration (replace `yourdomain.com` with your actual domain or server IP):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com;

    # 1. Backend REST API Route
    location /api/v1/ {
        proxy_pass http://127.0.0.1:5000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Maximum payload size for photo uploads (15MB)
        client_max_body_size 15M;
    }

    # 2. Frontend Web Client (Single Page Application)
    location / {
        root /var/www/chaircare-platform/ChairCare/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/chaircare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Install Free HTTPS SSL Certificate via Let's Encrypt:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```
*Certbot will automatically configure HTTPS, rewrite rules, and setup auto-renewal.*

---

### Step 5.6: Native Mobile Android APK Build

If you want to generate a standalone Android `.apk` or iOS build for field technicians and customers:

1. Create a free account at [expo.dev](https://expo.dev).
2. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
3. Log in inside the `ChairCare` directory:
   ```bash
   eas login
   ```
4. Build the Android APK:
   ```bash
   eas build -p android --profile preview
   ```
*EAS will compile the native Android bundle in the cloud and provide a direct download link for the `.apk` file.*

---

## 6. Default Pre-Configured Seed Accounts

When you execute `npm run seed`, the platform initializes with demo accounts for each role:

| Role | Email Login | Default Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@chaircare.com` | `Password@123` | Operations Command, Live Fleet Tracking, Escrow Arbitration, Rate Card & Platform Fee Config |
| **Field Technician** | `technician@chaircare.com` | `Password@123` | Job Queue, Active Telemetry, OTP Verification, Direct UPI QR Payments, Earnings Ledger |
| **Customer** | `customer@chaircare.com` | `Password@123` | 5-Step Ergonomic Booking, Live Technician GPS Map, Digital Invoices, Dispute Filing |

> [!TIP]
> After logging in as Super Admin, you can change passwords or create new administrators from the **Admin Settings** tab.

---

## 7. System Maintenance & Backups

### Checking Service Logs:
```bash
# View backend live logs
pm2 logs chaircare-backend

# Restart backend service
pm2 restart chaircare-backend

# View Nginx access & error logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Automated PostgreSQL Daily Backup Script:
Create a backup directory and automated backup cron job:
```bash
sudo mkdir -p /var/backups/chaircare_db
sudo nano /usr/local/bin/backup_chaircare_db.sh
```

Paste:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/chaircare_db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
pg_dump -U chaircare_user -h localhost chaircare | gzip > "$BACKUP_DIR/chaircare_$TIMESTAMP.sql.gz"
# Keep only last 14 days of backups
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +14 -exec rm {} \;
```

Make executable and add to crontab:
```bash
sudo chmod +x /usr/local/bin/backup_chaircare_db.sh
sudo crontab -e
# Run daily at 02:00 AM:
# 0 2 * * * /usr/local/bin/backup_chaircare_db.sh
```

---

## 📞 Support & Handover Inquiries

For technical assistance, architecture walkthroughs, or deployment support:
- **Primary Support Line**: `+91 92174 60742`
- **Email Contact**: `enquiry@offheman.in`
- **Reference Documentation**: See [ChairCare_Developer_Codebase_Reference.pdf](ChairCare_Developer_Codebase_Reference.pdf) in the project root for file-by-file technical architecture.

## 💻 Developers 

-- **Ansh & smruthi**
