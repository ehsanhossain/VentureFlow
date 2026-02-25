# VentureFlow Alpha Deployment Guide
## Updated: 2026-02-24

## Quick Start

### 1. Import Database
```bash
mysql -u VF_alpha -p VF_alpha < ventureflow_production.sql
# Password: alpha_vf
```

### 2. Upload Files
Extract `ventureflow/` to your Plesk document root.

In Plesk, set the **Document Root** to: `ventureflow/public`

### 3. Set Permissions (run on server)
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 4. Create Storage Symlink
```bash
php artisan storage:link
```

### 5. Clear Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### 6. Login
- **URL**: https://alpha.ventureflow.app
- **Email**: admin@ventureflow.com
- **Password**: VentureFlow@2026!

## File Structure
```
Deployment_zip/
├── ventureflow_production.sql   ← Import this into MySQL first
├── DEPLOYMENT_README.md         ← This file
├── ventureflow_alpha_deploy.zip ← Zip of the ventureflow/ folder
└── ventureflow/                 ← Extract to server root
    ├── .env                     ← Pre-configured for production (MySQL)
    ├── public/                  ← Set as Document Root in Plesk
    │   ├── index.php            ← Laravel entry point (API)
    │   ├── index.html           ← React SPA entry point
    │   ├── .htaccess            ← Routes API→Laravel, SPA→index.html
    │   ├── assets/              ← Compiled React/JS/CSS
    │   ├── flags/               ← Country flag assets
    │   └── images/              ← Image assets
    ├── app/                     ← Laravel application
    ├── config/                  ← Laravel config
    ├── database/                ← Migrations (no SQLite)
    ├── routes/                  ← API routes
    ├── storage/                 ← Logs, cache, uploads
    └── vendor/                  ← PHP dependencies
```

## Database Credentials
- **DB Name**: VF_alpha
- **DB User**: VF_alpha
- **DB Pass**: alpha_vf
- **Admin Email**: admin@ventureflow.com
- **Admin Pass**: VentureFlow@2026!

## Changes in This Update (2026-02-24)
- **Fixed**: DELETE routes for investors (`/api/buyer`) and targets (`/api/seller`) — bulk delete now works
- **Fixed**: EBITDA value displaying correctly in the target table (was mapped to wrong field name)
- **Fixed**: Added `use Auth` imports in controllers to prevent "Class not found" errors
- **Fixed**: Route parameter mismatch for pin/unpin functionality
- **Fixed**: Redirect logic after creating/editing investors and targets
- **Updated**: Frontend build with all latest fixes
- **Updated**: MySQL database export with latest data
