# Ventureflow - Quick Deployment Guide

**Version:** 1.0.0  
**Developer:** Legacy Script

> For detailed documentation, see [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Quick Start Checklist

### 1. MySQL Setup (5 minutes)

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE ventureflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ventureflow_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON ventureflow.* TO 'ventureflow_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Clone & Install (10 minutes)

```bash
# Clone repository
cd /var/www
sudo git clone <repository-url> ventureflow-backend
cd ventureflow-backend

# Install dependencies
composer install --optimize-autoloader --no-dev

# Set permissions
sudo chown -R www-data:www-data /var/www/ventureflow-backend
sudo chmod -R 755 /var/www/ventureflow-backend
sudo chmod -R 775 storage bootstrap/cache
```

### 3. Configure Environment (5 minutes)

```bash
# Create .env file
cp .env.example .env
nano .env
```

**Essential .env settings:**

```env
APP_NAME=Ventureflow
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
APP_VERSION=1.0.0
APP_DEVELOPER="Legacy Script"

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ventureflow
DB_USERNAME=ventureflow_user
DB_PASSWORD=YOUR_STRONG_PASSWORD

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### 4. Initialize Application (5 minutes)

```bash
# Generate key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 5. Web Server Setup

#### Apache (Quick)

```bash
# Create virtual host
sudo nano /etc/apache2/sites-available/ventureflow.conf
```

Paste:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/ventureflow-backend/public

    <Directory /var/www/ventureflow-backend/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

```bash
# Enable site
sudo a2enmod rewrite
sudo a2ensite ventureflow.conf
sudo systemctl restart apache2

# Get SSL
sudo certbot --apache -d yourdomain.com
```

#### Nginx (Quick)

```bash
# Create server block
sudo nano /etc/nginx/sites-available/ventureflow
```

Paste:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/ventureflow-backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ventureflow /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Get SSL
sudo certbot --nginx -d yourdomain.com
```

### 6. Setup Cron (2 minutes)

```bash
sudo crontab -e -u www-data
```

Add:

```cron
* * * * * cd /var/www/ventureflow-backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## Verification Commands

```bash
# Test application
php artisan about

# Check migrations
php artisan migrate:status

# Test endpoint
curl http://yourdomain.com
```

Expected response:

```json
{
    "app": "Ventureflow",
    "version": "1.0.0",
    "developer": "Legacy Script",
    "laravel": "12.19.3"
}
```

---

## Common Issues & Quick Fixes

### 500 Error

```bash
php artisan cache:clear
php artisan config:clear
sudo chmod -R 775 storage bootstrap/cache
```

### Database Connection Error

```bash
# Verify credentials
cat .env | grep DB_
# Test connection
mysql -u ventureflow_user -p ventureflow
```

### Permission Issues

```bash
sudo chown -R www-data:www-data /var/www/ventureflow-backend
sudo chmod -R 755 /var/www/ventureflow-backend
sudo chmod -R 775 storage bootstrap/cache
```

---

## Update Application

```bash
cd /var/www/ventureflow-backend
php artisan down
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
```

---

## Backup Command

```bash
# Database backup
mysqldump -u ventureflow_user -p ventureflow | gzip > backup_$(date +%Y%m%d).sql.gz

# Files backup
tar -czf backup_$(date +%Y%m%d).tar.gz /var/www/ventureflow-backend
```

---

**Total Deployment Time:** ~30 minutes

For detailed information, troubleshooting, and advanced configuration, refer to [DEPLOYMENT.md](DEPLOYMENT.md)
