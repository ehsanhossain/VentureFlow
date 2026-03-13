<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Extend the prospect_type enum in drive_files and drive_folders
     * to include 'partner' alongside 'investor' and 'target'.
     */
    public function up(): void
    {
        // For SQLite (local dev), enums are just TEXT — no change needed.
        // For PostgreSQL/MySQL, we need to alter the enum.
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: alter the enum type if it exists, or change column type
            DB::statement("ALTER TABLE drive_files ALTER COLUMN prospect_type TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE drive_folders ALTER COLUMN prospect_type TYPE VARCHAR(20)");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE drive_files MODIFY COLUMN prospect_type ENUM('investor', 'target', 'partner')");
            DB::statement("ALTER TABLE drive_folders MODIFY COLUMN prospect_type ENUM('investor', 'target', 'partner')");
        }
        // SQLite: TEXT columns accept any string, no action needed
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE drive_files MODIFY COLUMN prospect_type ENUM('investor', 'target')");
            DB::statement("ALTER TABLE drive_folders MODIFY COLUMN prospect_type ENUM('investor', 'target')");
        }
        // PostgreSQL/SQLite: no rollback needed for varchar/text
    }
};
