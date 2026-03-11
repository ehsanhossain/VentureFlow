<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drive_shares', function (Blueprint $table) {
            $table->boolean('allow_download')->default(true)->after('max_access_count');
        });
    }

    public function down(): void
    {
        Schema::table('drive_shares', function (Blueprint $table) {
            $table->dropColumn('allow_download');
        });
    }
};
