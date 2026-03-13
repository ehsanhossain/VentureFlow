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
        Schema::table('deal_stage_deadlines', function (Blueprint $table) {
            $table->boolean('is_parallel')->default(false)->after('end_date');
        });
    }

    public function down(): void
    {
        Schema::table('deal_stage_deadlines', function (Blueprint $table) {
            $table->dropColumn('is_parallel');
        });
    }
};
