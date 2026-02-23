<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sellers_company_overviews', function (Blueprint $table) {
            $table->json('financial_advisor')->nullable()->after('incharge_name');
            $table->json('internal_pic')->nullable()->after('financial_advisor');
        });

        Schema::table('buyers_company_overviews', function (Blueprint $table) {
            $table->json('financial_advisor')->nullable()->after('incharge_name');
            $table->json('internal_pic')->nullable()->after('financial_advisor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sellers_company_overviews', function (Blueprint $table) {
            $table->dropColumn(['financial_advisor', 'internal_pic']);
        });

        Schema::table('buyers_company_overviews', function (Blueprint $table) {
            $table->dropColumn(['financial_advisor', 'internal_pic']);
        });
    }
};
