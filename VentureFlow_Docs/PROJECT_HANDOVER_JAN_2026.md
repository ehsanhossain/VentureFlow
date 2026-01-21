# VentureFlow Project Handover Document
**Date:** January 19, 2026  
**Status:** Development Active (Local Environment)

---

## 1. Project Overview
VentureFlow is a comprehensive investment management and deal pipeline platform. It serves as a central hub for buyers, sellers, and venture partners to track deals, manage financial disclosures, and oversee the progress of various investment stages.

---

## 2. Technology Stack ("The Stake")

### **Frontend (Vite + React)**
- **Framework:** React 18.3.1
- **Language:** TypeScript
- **Tooling:** Vite (for fast development and bundling)
- **Styling:** Vanilla CSS + Tailwind CSS 3.4
- **State Management:** Zustand 5.0 (Client-side state)
- **Networking:** Axios (with Interceptors for Auth)
- **Key Libraries:**
  - `@dnd-kit`: Used for the drag-and-drop Deal Pipeline.
  - `Lucide React`: Premium iconography.
  - `i18next`: Multi-language architecture.
  - `Headless UI / Radix UI`: Accessible UI primitives.
  - `Zustand`: Global state for AUth and UI.

### **Backend (Laravel API)**
- **Framework:** Laravel 12
- **Language:** PHP 8.5
- **Authentication:** Laravel Sanctum (Bearer Token)
- **Database ORM:** Eloquent
- **Architecture:** API-First (Stateless)

---

## 3. Application Structure

### **Frontend Layout (`ventureflow-frontend`)**
- `src/pages/`: Contains feature-specific logic.
  - `buyer-portal/`: Management of buyer preferences and listings.
  - `seller-portal/`: Teaser centers and financial data for sellers.
  - `currency/`: Administrative tools for managing global exchange rates.
  - `employee/`: HR and User management.
- `src/components/`: Reusable UI elements (Alerts, Dashboards, Pinned items).
- `src/config/api.ts`: Central Axios instance and base URL configuration.
- `src/context/`: Authentication and notification contexts.

### **Backend Layout (`ventureflow-backend`)**
- `app/Http/Controllers/`: API logic (Deals, Partners, Files, etc.).
- `app/Models/`: Database entities (40+ models).
- `app/Services/`: Reusable business logic (e.g., File Uploads, Calculations).
- `database/migrations/`: Complete schema history (39+ migrations).
- `routes/api.php`: All REST endpoints.

---

## 4. Database Configuration

### **Local Setup**
- **Connection:** SQLite
- **Path:** `database/database.sqlite`
- **Current State:** Migrated and Seeded.
- **Key Tables:**
  - `users`: Core authentication data.
  - `deals`: Records all transaction attempts/pipelines.
  - `pipeline_stages`: Configurable steps for the deal flow.
  - `partners/buyers/sellers`: Profiles for the three primary user types.
  - `files/folders`: Virtual filesystem for storing documentation.

### **Production Readiness**
- The system includes a `docker-compose.yml` configured for **PostgreSQL 15**.
- Migration to MySQL or Postgres is managed via Laravel's `.env` configuration.

---

## 5. Current Running State (Handover Reference)

### **URL Access**
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)

### **Startup Commands**
```powershell
# In ventureflow-backend folder:
php artisan serve

# In ventureflow-frontend folder:
npm run dev
```

### **Authentication Logic**
- Users login via the frontend.
- Backend issues a Sanctum token.
- Token is stored in `localStorage` as `auth_token`.
- Frontend automatically includes this token in all headers via `api.interceptors.request`.

---

## 6. Development Notes & "Small Things"
- **OpenAI Key:** Located in backend `.env` for upcoming AI features.
- **VDS Applicability:** Sophisticated tax/VAT logic is present in the database schemas (`buyers_financial_details`).
- **Dynamic Pipelines:** Pipeline stages are now configurable via the database rather than hardcoded in the frontend.
- **Asset Management:** A vast collection of country flags and partner icons is maintained in `ventureflow-frontend/src/assets/flags`.

---
*Created by Antigravity AI for Project VentureFlow Handover.*
