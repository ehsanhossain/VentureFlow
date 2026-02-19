# VentureFlow — Post-Deployment Checklist

**Last Updated:** February 19, 2026  
**Purpose:** Everything you MUST do after uploading the application to your server to make all features work properly. Missing any of these steps will cause specific features to silently fail.

---

## Table of Contents

1. [Quick Reference — Critical Commands](#1-quick-reference--critical-commands)
2. [Laravel Scheduler (Cron Job)](#2-laravel-scheduler-cron-job)
3. [Queue Worker (Background Jobs)](#3-queue-worker-background-jobs)
4. [Environment Variables (.env)](#4-environment-variables-env)
5. [Database Setup](#5-database-setup)
6. [File Permissions](#6-file-permissions)
7. [Frontend Build & Deployment](#7-frontend-build--deployment)
8. [SSL / HTTPS](#8-ssl--https)
9. [Post-Upload Verification Checklist](#9-post-upload-verification-checklist)
10. [What Breaks Without Each Step](#10-what-breaks-without-each-step)

---

## 1. Quick Reference — Critical Commands

Run these **immediately** after uploading the backend to the server:

```bash
cd /var/www/ventureflow-backend

# Install dependencies (production mode)
composer install --optimize-autoloader --no-dev

# Run database migrations
php artisan migrate --force

# Seed roles & permissions (first time only)
php artisan db:seed --force

# Cache configuration for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage symlink (required for file uploads)
php artisan storage:link

# Set permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

## 2. Laravel Scheduler (Cron Job)

### What It Does
The Laravel Scheduler runs automated background tasks on a schedule. VentureFlow has **two scheduled tasks**:

| Task | Schedule | What It Does |
|------|----------|--------------|
| `currencies:refresh` | **Daily at midnight (00:00)** | Fetches live exchange rates from `open.er-api.com` and updates all registered currencies in the database |
| `deals:check-deadlines` | **Daily at 8:00 AM** | Checks for deals approaching their target close date (7 and 15 days out) and sends notifications to all users |

### How to Set Up

```bash
# Open the crontab for the web server user
sudo crontab -e -u www-data
```

Add this **single line** at the bottom:

```cron
* * * * * cd /var/www/ventureflow-backend && php artisan schedule:run >> /dev/null 2>&1
```

> **⚠️ This runs every minute**, but Laravel internally checks which tasks are due. It does NOT run your tasks every minute — it just checks every minute.

### How to Verify It's Working

```bash
# List all registered scheduled tasks
php artisan schedule:list

# Run the scheduler manually to test
php artisan schedule:run

# Check currency refresh log
cat storage/logs/currency-refresh.log

# Manually trigger currency refresh
php artisan currencies:refresh
```

### ❌ What Breaks Without This
- **Exchange rates** will freeze at whatever date they were last manually refreshed — they will NOT auto-update overnight
- **Deal deadline notifications** will never fire — users won't be warned about approaching close dates

---

## 3. Queue Worker (Background Jobs)

### What It Does
VentureFlow uses **database queues** (`QUEUE_CONNECTION=database`) for processing heavy background tasks. The following jobs run via the queue:

| Job | Triggered By | What It Does |
|-----|-------------|--------------|
| `ComputeMatchesJob` | New buyer/seller registration or profile update | Runs the MatchIQ scoring engine to find matching buyers/sellers |
| `MatchIQNotification` | After match computation | Sends database notifications to users about new strong matches (≥70% score) |

### How to Set Up

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/ventureflow-worker.service
```

Paste this content:

```ini
[Unit]
Description=VentureFlow Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ventureflow-backend
ExecStart=/usr/bin/php /var/www/ventureflow-backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable and start:

```bash
sudo systemctl enable ventureflow-worker
sudo systemctl start ventureflow-worker
```

### How to Verify It's Working

```bash
# Check worker status
sudo systemctl status ventureflow-worker

# View worker logs
sudo journalctl -u ventureflow-worker -f

# Check if there are pending jobs in the database
php artisan tinker
>>> DB::table('jobs')->count();
```

### ❌ What Breaks Without This
- **MatchIQ auto-matching** will NOT run when new investors/targets are registered — the jobs will pile up in the `jobs` table but never process
- **Match notifications** will never be sent to users
- Any future queued features will also fail silently

---

## 4. Environment Variables (.env)

### Critical Variables to Set

```env
# ── Application ──
APP_NAME=VentureFlow
APP_ENV=production
APP_KEY=base64:...          # Generate with: php artisan key:generate
APP_DEBUG=false              # MUST be false in production!
APP_URL=https://yourdomain.com

# ── Database ──
DB_CONNECTION=mysql          # Change from sqlite to mysql for production
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ventureflow
DB_USERNAME=ventureflow_user
DB_PASSWORD=your_secure_password

# ── Queue (MUST be 'database') ──
QUEUE_CONNECTION=database

# ── Frontend URL (for CORS) ──
FRONTEND_URL=https://yourdomain.com

# ── Session ──
SESSION_DRIVER=database
SESSION_LIFETIME=120

# ── Sanctum (Auth) ──
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
```

### ❌ What Breaks With Wrong Values
- `APP_DEBUG=true` → Exposes stack traces and sensitive data to the public
- `QUEUE_CONNECTION=sync` → Jobs run inline (slow API responses when registering buyers/sellers)
- `FRONTEND_URL` wrong → CORS errors, login fails
- `DB_CONNECTION=sqlite` → Lost data on server restart (use MySQL/PostgreSQL for production)

---

## 5. Database Setup

### First-Time Setup

```bash
# Create the database (MySQL)
mysql -u root -p
CREATE DATABASE ventureflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ventureflow_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON ventureflow.* TO 'ventureflow_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
php artisan migrate --force

# Seed initial data (roles, permissions, admin user)
php artisan db:seed --force
```

### Required Tables Created by Migrations
- `users` — Authentication & user profiles
- `currencies` — Exchange rate data (auto-refreshed nightly)
- `matches` — MatchIQ buyer-seller match results
- `deals` — Deal pipeline records
- `jobs` — Queue worker job storage
- `notifications` — Database notifications
- `pipeline_stages` — Configurable deal stages
- `buyers`, `sellers`, `partners` — Prospect profiles
- `countries`, `industries` — Reference data

---

## 6. File Permissions

```bash
# Set ownership to the web server user
sudo chown -R www-data:www-data /var/www/ventureflow-backend

# Set base permissions
sudo chmod -R 755 /var/www/ventureflow-backend

# Writable directories
sudo chmod -R 775 /var/www/ventureflow-backend/storage
sudo chmod -R 775 /var/www/ventureflow-backend/bootstrap/cache

# Protect the .env file
sudo chmod 600 /var/www/ventureflow-backend/.env
```

### ❌ What Breaks Without Correct Permissions
- `storage/` not writable → Log files can't be created, file uploads fail, sessions break
- `bootstrap/cache/` not writable → Config/route caching fails
- `.env` readable by others → Security vulnerability

---

## 7. Frontend Build & Deployment

### Build the Production Bundle

```bash
cd /path/to/ventureflow-frontend

# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist/` folder containing the compiled static files.

### Deploy Static Files

Copy the contents of `dist/` to your web server's public root, or configure Nginx/Apache to serve from the `dist/` directory.

**Important:** The frontend is a Single Page Application (SPA). You need to configure your web server to redirect all routes to `index.html`:

**Nginx:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

### Frontend Environment
The API base URL is configured in `src/config/api.ts`. For production, ensure it points to your backend domain:

```
VITE_API_URL=https://api.yourdomain.com
```

---

## 8. SSL / HTTPS

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew (certbot adds this automatically)
sudo certbot renew --dry-run
```

Force HTTPS in Laravel — add to `app/Providers/AppServiceProvider.php`:

```php
public function boot()
{
    if ($this->app->environment('production')) {
        \URL::forceScheme('https');
    }
}
```

---

## 9. Post-Upload Verification Checklist

Run through this checklist **every time** you deploy or update the application:

### Backend Verification
- [ ] `php artisan about` — shows application info without errors
- [ ] `php artisan migrate:status` — all migrations are "Ran"
- [ ] `php artisan route:list` — routes are registered
- [ ] `php artisan schedule:list` — shows `currencies:refresh` and `deals:check-deadlines`
- [ ] `php artisan currencies:refresh` — successfully updates exchange rates
- [ ] `sudo systemctl status ventureflow-worker` — queue worker is active
- [ ] `curl https://yourdomain.com/api/health` — API responds

### Frontend Verification
- [ ] Login page loads without console errors
- [ ] Login works with valid credentials
- [ ] Dashboard loads with KPI data
- [ ] Prospects page shows investor/target lists
- [ ] Currency Management page shows currencies with today's exchange rates
- [ ] Deal Pipeline loads and cards are draggable
- [ ] Notifications bell shows recent notifications

### Feature-Specific Checks
- [ ] **Currency Refresh**: Go to Settings → Currency, click "Refresh" — rates should update
- [ ] **MatchIQ**: Go to MatchIQ, click "Run Scan" — should compute matches
- [ ] **File Upload**: Upload a file in any profile — should save to storage
- [ ] **Notifications**: Register a new investor — should trigger match notifications (if queue worker is running)

---

## 10. What Breaks Without Each Step

| Missing Step | Visible Symptom | Silent Failure |
|---|---|---|
| **No cron job** | Exchange rates frozen at upload date | Deal deadline notifications never fire |
| **No queue worker** | — | MatchIQ auto-matching never runs on new registrations; notifications not sent |
| **Wrong FRONTEND_URL** | CORS errors on login | API calls blocked |
| **APP_DEBUG=true** | — | Stack traces exposed to public (security risk) |
| **storage/ not writable** | 500 errors on login | Logs, sessions, file uploads all fail |
| **No storage:link** | Uploaded files return 404 | Profile images, documents broken |
| **DATABASE not migrated** | 500 errors everywhere | — |
| **QUEUE_CONNECTION=sync** | Slow registration (10+ seconds) | Not a failure, but poor UX |

---

## Plesk-Specific Notes

If deploying on Plesk:

1. **Cron Job**: Go to **Tools & Settings → Scheduled Tasks** and add:
   ```
   * * * * * cd /var/www/vhosts/yourdomain.com/ventureflow-backend && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
   ```

2. **Queue Worker**: You may need to use Supervisor instead of systemd on some Plesk configurations. Install Supervisor:
   ```bash
   sudo apt install supervisor
   ```
   
   Create `/etc/supervisor/conf.d/ventureflow-worker.conf`:
   ```ini
   [program:ventureflow-worker]
   process_name=%(program_name)s_%(process_num)02d
   command=/usr/bin/php /var/www/vhosts/yourdomain.com/ventureflow-backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
   autostart=true
   autorestart=true
   user=www-data
   numprocs=1
   redirect_stderr=true
   stdout_logfile=/var/www/vhosts/yourdomain.com/ventureflow-backend/storage/logs/worker.log
   ```
   
   Then:
   ```bash
   sudo supervisorctl reread
   sudo supervisorctl update
   sudo supervisorctl start ventureflow-worker:*
   ```

3. **PHP Version**: Ensure Plesk is using PHP 8.2+ for the domain. Check in **Websites & Domains → PHP Settings**.

4. **Document Root**: Point the domain's document root to `ventureflow-backend/public` for the API, or set up a subdomain.

---

## Update Deployment (Subsequent Uploads)

When pushing updates to the server:

```bash
cd /var/www/ventureflow-backend

# Put app in maintenance mode
php artisan down

# Pull latest changes
git pull origin main

# Install dependencies
composer install --optimize-autoloader --no-dev

# Run new migrations
php artisan migrate --force

# Clear and rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart queue worker (picks up code changes)
sudo systemctl restart ventureflow-worker
# OR with Supervisor:
sudo supervisorctl restart ventureflow-worker:*

# Bring app back online
php artisan up
```

> **⚠️ Always restart the queue worker after code changes!** The worker loads code into memory — without a restart, it runs old code.

---

*Document maintained by the VentureFlow development team.*
