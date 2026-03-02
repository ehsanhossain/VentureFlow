# Ventureflow Backend - Deployment Documentation

**Version:** 1.0.0  
**Developer:** Legacy Script  
**Framework:** Laravel 12.19.3

---

## Table of Contents

1. [Server Requirements](#server-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [MySQL Database Setup](#mysql-database-setup)
4. [Application Deployment](#application-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Web Server Configuration](#web-server-configuration)
7. [Post-Deployment Tasks](#post-deployment-tasks)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Server Requirements

### Minimum Requirements

-   **PHP:** 8.2 or higher
-   **MySQL:** 8.0 or higher (or MariaDB 10.3+)
-   **Web Server:** Apache 2.4+ or Nginx 1.18+
-   **Composer:** 2.x
-   **Memory:** 512MB RAM minimum (1GB+ recommended)
-   **Disk Space:** 500MB minimum

### Required PHP Extensions

```bash
php -m
```

Ensure the following extensions are installed:

-   BCMath
-   Ctype
-   cURL
-   DOM
-   Fileinfo
-   JSON
-   Mbstring
-   OpenSSL
-   PDO
-   PDO_MySQL
-   Tokenizer
-   XML
-   ZIP

### Installing PHP Extensions (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install php8.2 php8.2-cli php8.2-common php8.2-mysql php8.2-zip \
php8.2-gd php8.2-mbstring php8.2-curl php8.2-xml php8.2-bcmath
```

### Installing PHP Extensions (CentOS/RHEL)

```bash
sudo yum install php php-cli php-common php-mysql php-zip php-gd \
php-mbstring php-curl php-xml php-bcmath
```

---

## Pre-Deployment Checklist

-   [ ] Server meets all requirements
-   [ ] MySQL database server is installed and running
-   [ ] SSH access to the server
-   [ ] Domain name configured (optional)
-   [ ] SSL certificate ready (recommended)
-   [ ] Git installed on server
-   [ ] Composer installed globally

---

## MySQL Database Setup

### 1. Install MySQL Server

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**CentOS/RHEL:**

```bash
sudo yum install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### 2. Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

Follow the prompts to:

-   Set root password
-   Remove anonymous users
-   Disallow root login remotely
-   Remove test database
-   Reload privilege tables

### 3. Create Database and User

Login to MySQL:

```bash
sudo mysql -u root -p
```

Execute the following SQL commands:

```sql
-- Create database
CREATE DATABASE ventureflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'your_password' with a strong password)
CREATE USER 'ventureflow_user'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON ventureflow.* TO 'ventureflow_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify database creation
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

### 4. Test Database Connection

```bash
mysql -u ventureflow_user -p ventureflow
```

---

## Application Deployment

### 1. Clone Repository

```bash
# Navigate to web directory
cd /var/www

# Clone the repository
sudo git clone <your-repository-url> ventureflow-backend

# Set ownership
sudo chown -R $USER:$USER /var/www/ventureflow-backend

# Navigate to project directory
cd ventureflow-backend
```

### 2. Install Composer Dependencies

```bash
# Install Composer if not already installed
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install dependencies
composer install --optimize-autoloader --no-dev
```

### 3. Set Directory Permissions

```bash
# Set proper permissions
sudo chown -R www-data:www-data /var/www/ventureflow-backend
sudo chmod -R 755 /var/www/ventureflow-backend
sudo chmod -R 775 /var/www/ventureflow-backend/storage
sudo chmod -R 775 /var/www/ventureflow-backend/bootstrap/cache
```

---

## Environment Configuration

### 1. Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Edit environment file
nano .env
```

### 2. Configure Environment Variables

Update the `.env` file with the following configuration:

```env
# Application Settings
APP_NAME=Ventureflow
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://yourdomain.com
APP_VERSION=1.0.0
APP_DEVELOPER="Legacy Script"

# Frontend URL (if applicable)
FRONTEND_URL=https://yourdomain.com
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DOMAIN=.yourdomain.com

# Localization
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

# Maintenance
APP_MAINTENANCE_DRIVER=file

# PHP Settings
PHP_CLI_SERVER_WORKERS=4
BCRYPT_ROUNDS=12

# Logging
LOG_CHANNEL=stack
LOG_STACK=single,daily
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

# Database Configuration (MySQL)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ventureflow
DB_USERNAME=ventureflow_user
DB_PASSWORD=your_password

# Session Configuration
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null
SESSION_SAME_SITE=lax

# Cache Configuration
BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

# Redis (Optional - for better performance)
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@yourdomain.com"
MAIL_FROM_NAME="${APP_NAME}"

# AWS (if using S3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

# Vite
VITE_APP_NAME="${APP_NAME}"
```

### 3. Generate Application Key

```bash
php artisan key:generate
```

### 4. Run Database Migrations

```bash
# Run migrations
php artisan migrate --force

# (Optional) Seed database with initial data
php artisan db:seed --force
```

### 5. Optimize Application

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize
```

---

## Web Server Configuration

### Option 1: Apache Configuration

#### 1. Install Apache

```bash
sudo apt install apache2
sudo systemctl start apache2
sudo systemctl enable apache2
```

#### 2. Enable Required Modules

```bash
sudo a2enmod rewrite
sudo a2enmod ssl
sudo systemctl restart apache2
```

#### 3. Create Virtual Host

Create file: `/etc/apache2/sites-available/ventureflow.conf`

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    ServerAdmin admin@yourdomain.com

    DocumentRoot /var/www/ventureflow-backend/public

    <Directory /var/www/ventureflow-backend/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/ventureflow-error.log
    CustomLog ${APACHE_LOG_DIR}/ventureflow-access.log combined
</VirtualHost>
```

#### 4. Enable Site and Restart Apache

```bash
sudo a2ensite ventureflow.conf
sudo a2dissite 000-default.conf
sudo systemctl restart apache2
```

#### 5. SSL Configuration (Recommended)

Install Certbot:

```bash
sudo apt install certbot python3-certbot-apache
```

Obtain SSL certificate:

```bash
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

### Option 2: Nginx Configuration

#### 1. Install Nginx

```bash
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 2. Create Server Block

Create file: `/etc/nginx/sites-available/ventureflow`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/ventureflow-backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

#### 3. Enable Site and Restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/ventureflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Install PHP-FPM

```bash
sudo apt install php8.2-fpm
sudo systemctl start php8.2-fpm
sudo systemctl enable php8.2-fpm
```

#### 5. SSL Configuration (Recommended)

Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
```

Obtain SSL certificate:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Post-Deployment Tasks

### 1. Set Up Cron Jobs

Edit crontab:

```bash
sudo crontab -e -u www-data
```

Add the following line:

```cron
* * * * * cd /var/www/ventureflow-backend && php artisan schedule:run >> /dev/null 2>&1
```

### 2. Set Up Queue Worker (if using queues)

Create systemd service: `/etc/systemd/system/ventureflow-worker.service`

```ini
[Unit]
Description=Ventureflow Queue Worker
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

Enable and start the service:

```bash
sudo systemctl enable ventureflow-worker
sudo systemctl start ventureflow-worker
```

### 3. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

### 4. Set Up Log Rotation

Create file: `/etc/logrotate.d/ventureflow`

```
/var/www/ventureflow-backend/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### 5. Verify Deployment

```bash
# Check application status
php artisan about

# Test database connection
php artisan migrate:status

# Check routes
php artisan route:list

# Test the application
curl http://yourdomain.com
```

---

## Security Best Practices

### 1. Environment File Security

```bash
# Ensure .env is not accessible
sudo chmod 600 /var/www/ventureflow-backend/.env
sudo chown www-data:www-data /var/www/ventureflow-backend/.env
```

### 2. Disable Directory Listing

Already configured in Apache/Nginx configurations above.

### 3. Keep Software Updated

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Composer dependencies
composer update --no-dev
```

### 4. Enable HTTPS Only

Force HTTPS in `.env`:

```env
APP_URL=https://yourdomain.com
```

Add to `app/Providers/AppServiceProvider.php` boot method:

```php
if ($this->app->environment('production')) {
    \URL::forceScheme('https');
}
```

### 5. Database Backup Strategy

Create backup script: `/usr/local/bin/backup-ventureflow.sh`

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ventureflow"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ventureflow"
DB_USER="ventureflow_user"
DB_PASS="your_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup application files
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/ventureflow-backend

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and add to cron:

```bash
sudo chmod +x /usr/local/bin/backup-ventureflow.sh
sudo crontab -e
```

Add daily backup at 2 AM:

```cron
0 2 * * * /usr/local/bin/backup-ventureflow.sh >> /var/log/ventureflow-backup.log 2>&1
```

### 6. Monitor Application Logs

```bash
# View Laravel logs
tail -f /var/www/ventureflow-backend/storage/logs/laravel.log

# View web server logs (Apache)
tail -f /var/log/apache2/ventureflow-error.log

# View web server logs (Nginx)
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Solution:**

```bash
# Check Laravel logs
tail -n 50 /var/www/ventureflow-backend/storage/logs/laravel.log

# Check web server logs
tail -n 50 /var/log/apache2/error.log  # Apache
tail -n 50 /var/log/nginx/error.log    # Nginx

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Issue: Database Connection Error

**Solution:**

```bash
# Test MySQL connection
mysql -u ventureflow_user -p ventureflow

# Verify .env database credentials
cat .env | grep DB_

# Check MySQL service status
sudo systemctl status mysql
```

### Issue: Permission Denied Errors

**Solution:**

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/ventureflow-backend

# Fix permissions
sudo chmod -R 755 /var/www/ventureflow-backend
sudo chmod -R 775 /var/www/ventureflow-backend/storage
sudo chmod -R 775 /var/www/ventureflow-backend/bootstrap/cache
```

### Issue: Composer Memory Limit

**Solution:**

```bash
# Increase PHP memory limit temporarily
php -d memory_limit=-1 /usr/local/bin/composer install
```

### Issue: Migration Errors

**Solution:**

```bash
# Rollback last migration
php artisan migrate:rollback

# Fresh migration (WARNING: drops all tables)
php artisan migrate:fresh

# Check migration status
php artisan migrate:status
```

### Issue: Queue Jobs Not Processing

**Solution:**

```bash
# Check worker status
sudo systemctl status ventureflow-worker

# Restart worker
sudo systemctl restart ventureflow-worker

# View worker logs
sudo journalctl -u ventureflow-worker -f
```

### Issue: SSL Certificate Issues

**Solution:**

```bash
# Renew SSL certificate
sudo certbot renew

# Test SSL configuration
sudo certbot certificates
```

---

## Maintenance Commands

### Update Application

```bash
# Navigate to project directory
cd /var/www/ventureflow-backend

# Put application in maintenance mode
php artisan down

# Pull latest changes
git pull origin main

# Install/update dependencies
composer install --optimize-autoloader --no-dev

# Run migrations
php artisan migrate --force

# Clear and cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Bring application back online
php artisan up
```

### Monitor Performance

```bash
# Check PHP-FPM status
sudo systemctl status php8.2-fpm

# Check web server status
sudo systemctl status apache2  # or nginx

# Check MySQL status
sudo systemctl status mysql

# View active connections
mysqladmin -u root -p processlist
```

---

## Support & Contact

**Developer:** Legacy Script  
**Version:** 1.0.0  
**Documentation Last Updated:** December 10, 2025

For support and inquiries, please contact your system administrator or Legacy Script support team.

---

## Changelog

### Version 1.0.0 (2025-12-10)

-   Initial deployment documentation
-   MySQL configuration guide
-   Apache and Nginx setup instructions
-   Security best practices
-   Troubleshooting guide

---

**End of Documentation**
