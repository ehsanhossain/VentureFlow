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
        Schema::create('sellers_teaser_centers', function (Blueprint $table) {
            $table->id();

            $table->string('teaser_heading_name')->nullable();
            $table->json('industry')->nullable();
            $table->foreignId('hq_origin_country_id')->nullable()->constrained('countries');
            $table->year('year_founded')->nullable();
            $table->string('current_employee_count')->nullable();
            $table->string('company_rank')->nullable();
            $table->string('selling_reason')->nullable();
            $table->text('teaser_details')->nullable();
            $table->decimal('ebitda_value', 15, 2)->nullable();
            $table->decimal('monthly_revenue', 15, 2)->nullable();
            $table->string('misp')->nullable();
            $table->decimal('expected_investment_amount', 15, 2)->nullable();
            $table->string('ma_structure')->nullable();

            // Checkboxes
            $table->boolean('has_industry')->nullable()->default(false);
            $table->boolean('has_rank')->nullable()->default(false);
            $table->boolean('has_teaser_description')->nullable()->default(false);
            $table->boolean('has_hq_origin_country')->nullable()->default(false);
            $table->boolean('has_expected_investment')->nullable()->default(false);
            $table->boolean('has_year_founded')->nullable()->default(false);
            $table->boolean('has_emp_count')->nullable()->default(false);
            $table->boolean('has_selling_reason')->nullable()->default(false);
            $table->boolean('has_ma_structure')->nullable()->default(false);
            $table->boolean('has_teaser_name')->nullable()->default(false);
            $table->boolean('is_industry_checked')->nullable()->default(false);

            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sellers_teaser_centers');
    }
};
