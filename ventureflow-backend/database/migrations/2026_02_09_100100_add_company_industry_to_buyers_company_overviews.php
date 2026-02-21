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
    /**
     * Add company_industry column to buyers_company_overviews
     * to store the investor's own industry (distinct from target industries).
     */
    public function up(): void
    {
        Schema::table('buyers_company_overviews', function (Blueprint $table) {
            $table->json('company_industry')->nullable()->after('main_industry_operations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buyers_company_overviews', function (Blueprint $table) {
            $table->dropColumn('company_industry');
        });
    }
};
