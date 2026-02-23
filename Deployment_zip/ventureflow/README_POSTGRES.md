# VentureFlow PostgreSQL & Docker Deployment Guide

This repository has been prepared for PostgreSQL deployment. Follow these steps to transition from local SQLite to a production-ready PostgreSQL environment.

## 1. Prerequisites
- Docker and Docker Compose installed on the server.
- Or a direct PostgreSQL installation.

## 2. Docker Setup (Recommended)
We have provided a `Dockerfile` and `docker-compose.yml` for easy deployment.

### Steps:
1. Move to the `ventureflow-backend` directory.
2. Ensure your `.env` file is configured for PostgreSQL (see below).
3. Run:
   ```bash
   docker-compose up -d
   ```
   This will start the PHP application on port 8000 and a PostgreSQL database.

## 3. Manual PostgreSQL Configuration
If you are not using Docker, ensure your server's PHP has `pdo_pgsql` enabled.

### .env Configuration:
Update your `.env` file with these settings:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1 (or 'db' if using docker-compose)
DB_PORT=5432
DB_DATABASE=ventureflow
DB_USERNAME=ventureflow
DB_PASSWORD=your_secure_password
```

## 4. Running Migrations
Once connected to PostgreSQL, run the following command to set up the schema:
```bash
php artisan migrate:fresh --seed
```
*Note: This will recreate all tables. Use `php artisan migrate` if you have existing data to preserve.*

## 5. Staff Creation Fixes
The system has been updated to handle optional fields (Nationality, Contact Number, etc.) as nullable. This prevents "Integrity Constraint" errors that previously occurred when these fields were omitted.
