# VentureFlow Deployment Guide

## Architecture Overview

```
┌─────────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Local Dev      │    │   GitHub     │    │  GitHub      │    │  Plesk       │
│  (main branch)  │───►│  main branch │───►│  Actions CI  │───►│  Production  │
│                 │    │              │    │  (deploy.yml)│    │  Server      │
└─────────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

## Repository Structure

```
VentureFlow Codes/                    ← Git repo root
├── ventureflow-backend/              ← Laravel API (PHP 8.3)
│   ├── public/test.php               ← LOCAL test.php (NOT used on server)
│   ├── routes/api.php                ← API routes
│   └── ...
├── ventureflow-frontend/             ← React + Vite SPA
│   ├── dist/                         ← Built output (gitignored, built by CI)
│   ├── .gitignore                    ← dist is ignored here
│   └── ...
├── Deployment automation/
│   └── test.php                      ← ⚠️ THIS is the test.php deployed to server
├── .github/workflows/deploy.yml      ← CI/CD pipeline definition
└── VentureFlow_Docs/                 ← Documentation
```

## CI/CD Pipeline Flow

### Step 1: Push to `main`

Developers push code changes to the `main` branch on GitHub.

### Step 2: GitHub Actions Triggers

The workflow at `.github/workflows/deploy.yml` triggers on:
- Push to `main` (if `ventureflow-backend/**`, `ventureflow-frontend/**`, or `Deployment automation/**` changed)
- Manual dispatch from GitHub Actions tab

### Step 3: GitHub Actions Build Process

1. **Checkout code** from `main`
2. **Setup Node.js 20** + install frontend deps (`npm ci`)
3. **Build frontend** (`npm run build` in `ventureflow-frontend/`)
4. **Setup PHP 8.3** + Composer
5. **Prepare deploy folder**:
   - Copy `ventureflow-backend/` → `deploy/`
   - Copy `ventureflow-frontend/dist/*` → `deploy/public/` (frontend served from Laravel's public dir)
   - Copy `Deployment automation/test.php` → `deploy/public/test.php`
   - Create storage directories with `.gitkeep`
6. **Install Composer deps** (production only)
7. **Create production `.env`** (hardcoded in workflow)
8. **Push to `deploy` branch** (force orphan — clean history each time)

### Step 4: Plesk Pulls `deploy` Branch

In Plesk, the Git repository is configured to pull from the `deploy` branch into:
```
/var/www/vhosts/ventureflow.app/httpdocs/
```

### Step 5: Run `test.php` to Finalize

Visit `https://ventureflow.app/test.php` to:
- Clear all caches (bootstrap, config, route, view)
- Create storage directories
- Fix permissions
- Run `composer install`
- Run database migrations
- Create storage symlink

## Important Rules

### Which test.php to edit?
- **Server uses**: `Deployment automation/test.php`
- **NOT**: `ventureflow-backend/public/test.php`

The CI/CD workflow copies `Deployment automation/test.php` into `deploy/public/test.php`, overwriting the backend's version.

### Frontend build
- The `dist/` folder is **gitignored** in the frontend — it is NOT committed to `main`
- GitHub Actions builds the frontend and places `dist/*` into `deploy/public/`
- You do **NOT** need to commit `dist/` or run `npm run build` on the server
- Any frontend change requires pushing to `main` → CI builds → pull `deploy` in Plesk

### Backend changes only
For backend-only changes (routes, controllers, migrations), the flow is the same:
Push to `main` → CI runs → pull `deploy` in Plesk → run `test.php`

## Server Details

| Item | Value |
|------|-------|
| Server | Plesk |
| Document root | `/var/www/vhosts/ventureflow.app/httpdocs/` |
| PHP version | 8.3 (`/opt/plesk/php/8.3/bin/php`) |
| Database | MySQL (`VF_production`) |
| Domain | `ventureflow.app` / `www.ventureflow.app` |
| Git branch (server) | `deploy` |
| Git branch (development) | `main` |

## Deployment Checklist

1. Push changes to `main` branch
2. Check GitHub Actions: verify the "Deploy to Production" workflow succeeds
3. In Plesk: Git pull the `deploy` branch
4. Visit `https://ventureflow.app/test.php` to clear caches and run migrations
5. Test the changes on the live site
