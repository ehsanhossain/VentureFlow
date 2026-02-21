<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('buyers_teaser_centers', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string('teaser_heading')->nullable();        // Teaser Heading Name
                   
            $table->json('b_in')->nullable();      //Broader Industry Preferences (1st)

            $table->json('target_countries')->nullable();      // Buyer’s Targeted Countries
            $table->string('emp_count_range')->nullable();       // Employee Count Range (FTE)

            $table->json('expected_ebitda')->nullable();         // Expected EBITDA Requirements (Times) {min, max}
            $table->json('acquire_pct')->nullable();             // Desirable Acquiring Percentage Range {min, max}
            $table->json('valuation_range')->nullable();         // Total Valuation Within {min, max}
            $table->string('investment_amount')->nullable();     // Expected Investment Amount (Desired Amount)
            $table->string('growth_rate_yoy')->nullable();       // Growth Rate (YOY)
            $table->boolean('has_teaser_description')->nullable()->default(false);
            $table->boolean('has_border_industry_preference')->nullable()->default(false);
            $table->boolean('has_buyer_targeted_countries')->nullable()->default(false);
            $table->boolean('has_emp_count_range')->nullable()->default(false);
            $table->boolean('has_expected_ebitda')->nullable()->default(false);
            $table->boolean('has_acquiring_percentage')->nullable()->default(false);
            $table->boolean('has_valuation_range')->nullable()->default(false);
            $table->boolean('has_investment_amount')->nullable()->default(false);
            $table->boolean('has_growth_rate_yoy')->nullable()->default(false);
            $table->boolean('has_teaser_name')->nullable()->default(false);
            $table->boolean('has_industry')->nullable()->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('buyers_teaser_centers');
    }
};
