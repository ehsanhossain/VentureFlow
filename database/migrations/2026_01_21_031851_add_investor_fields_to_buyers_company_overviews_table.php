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
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('buyers_company_overviews', function (Blueprint $table) {
            $table->string('rank')->nullable()->after('buyer_id');
            $table->json('contacts')->nullable()->after('rank');
            $table->json('investment_budget')->nullable()->after('contacts');
            $table->text('investment_condition')->nullable()->after('investment_budget');
            $table->json('target_countries')->nullable()->after('investment_condition');
            $table->string('investor_profile_link')->nullable()->after('target_countries');
            $table->json('introduced_projects')->nullable()->after('investor_profile_link');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buyers_company_overviews', function (Blueprint $table) {
            $table->dropColumn([
                'rank',
                'contacts',
                'investment_budget',
                'investment_condition',
                'target_countries',
                'investor_profile_link',
                'introduced_projects',
            ]);
        });
    }
};
