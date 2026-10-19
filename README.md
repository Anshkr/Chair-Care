# ChairCare 🪑⚡
> Professional Office Chair Services, On-Demand Repair, Maintenance & Operations Platform.

ChairCare is a full-stack, enterprise-grade ergonomic chair maintenance and repair ecosystem featuring a cross-platform mobile client (React Native / Expo), a Node.js + TypeScript REST backend, real-time telemetry, and a PostgreSQL database on Neon.

---

## 🌟 Key Features

- **Multi-Role Experience**: Isolated views and navigation flows for **Customers**, **Field Technicians**, and **Super Admins**.
- **Real-Time Live Operations**: Real-time technician telemetry, job lifecycle tracking, status sync, and map tracking.
- **Customer Issue & Dispute System**: Direct dispute and claim ticketing (`DSP-XXXX` / `TKT-XXXX`) connected directly to admin resolution feeds.
- **Specialist Reviews & Ratings**: Post-service rating and review submissions that dynamically recalculate specialist performance metrics in real-time.
- **Offline Diagnostics & Synchronization**: Local optimistic caching, offline simulation, and sync queue.
- **Interactive Walkthrough Onboarding**: Persistent single-time onboarding flow that automatically bypasses returning users.

---

## 🏗️ Architecture

```
ChairCare/
├── src/                    # Cross-platform React Native / Expo Frontend
│   ├── components/         # Reusable design system UI components
│   ├── screens/            # 80+ Screens (Customer, Technician, Admin, Intro)
│   ├── navigation/         # Role-based navigation guards & stacks
│   ├── services/api/       # Centralized REST API client & real-time sync
│   ├── context/            # AuthContext, ThemeContext, IntroContext
│   └── utils/              # Storage, formatting, offline helpers
├── backend/                # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── controllers/    # Customer, Technician, Admin, LiveOps controllers
│   │   ├── routes/         # Authenticated REST endpoints
│   │   ├── db/             # PostgreSQL connection pool (Neon Cloud)
│   │   └── migrations/     # Database migration scripts
│   └── package.json
├── assets/                 # App icons, splash screens, and illustrations
├── app.json                # Expo mobile configuration
├── eas.json                # EAS Build configuration for Android APK
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+)
- [Expo CLI](https://docs.expo.dev/) (`npx expo`)
- [PostgreSQL](https://neon.tech/) connection (Neon or local)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env     # Fill in your Neon DATABASE_URL and JWT_SECRET
npm run dev
```

### 3. Frontend Setup
```bash
npm install
npm start
```
- Press `w` to open in Web browser.
- Press `a` or scan QR code with **Expo Go** on Android to run natively.

---

## 📱 Building the Standalone Android APK

1. Log in to Expo:
   ```bash
   npx eas login
   ```
2. Build standalone `.apk`:
   ```bash
   npx eas build -p android --profile preview
   ```

---

## 📄 License
ISC
