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
        Schema::table('deals', function (Blueprint $table) {
            if (!Schema::hasColumn('deals', 'investment_condition')) {
                $table->string('investment_condition', 100)->nullable()->after('deal_type');
            }
            if (!Schema::hasColumn('deals', 'ebitda_investor_value')) {
                $table->decimal('ebitda_investor_value', 20, 2)->nullable();
            }
            if (!Schema::hasColumn('deals', 'ebitda_investor_times')) {
                $table->decimal('ebitda_investor_times', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('deals', 'ebitda_target_value')) {
                $table->decimal('ebitda_target_value', 20, 2)->nullable();
            }
            if (!Schema::hasColumn('deals', 'ebitda_target_times')) {
                $table->decimal('ebitda_target_times', 10, 2)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->dropColumn([
                'investment_condition',
                'ebitda_investor_value',
                'ebitda_investor_times',
                'ebitda_target_value',
                'ebitda_target_times',
            ]);
        });
    }
};
