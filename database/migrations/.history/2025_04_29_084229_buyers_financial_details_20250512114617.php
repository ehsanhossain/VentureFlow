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
        Schema::create('buyers_financial_details', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('default_currency')->nullable();          // Default Currency
            $table->string('register_currency')->nullable();         // Register Currency Here
            $table->string('related_country')->nullable();           // Select Related Country

            $table->json('investment_budget')->nullable();           // Investment Budget Range {min, max}
            $table->string('ebitda_margin_latest')->nullable();      // EBITDA Margin Latest Year
            $table->json('ebitda_multiple')->nullable();           // EBITDA last year (multiple)


            $table->json('expected_ebitda')->nullable();             // Expected EBITDA Requirements (Times) {min, max}
            $table->json('profit_multiple')->nullable();             // Ideal Profit Multiple Range (this Year) {min, max}
            $table->json('ttm_revenue')->nullable();                 // Trailing Twelve-Month Revenue Range {min, max}
            $table->json('ttm_profit')->nullable();                  // Trailing Twelve-Month Profit Range {min, max}

            $table->string('ma_structure')->nullable();              // M&A Structure
            $table->json('acquire_pct')->nullable();               // Desirable Acquiring Percentage Range {min, max}
            //Round Estimation Criteria
            $table->boolean('is_minority')->nullable()->default(false);          // Is Minority
            $table->boolean('is_majority')->nullable()->default(false);          // Is Majority
            $table->boolean('is_negotiable')->nullable()->default(false);        // Is Negotiable


            $table->string('ownership_type')->nullable();
                                                                    // Shareholding/Ownership Percentage {min, max}
            $table->json('valuation')->nullable();                   // Total Valuation Within {min, max}

            $table->string('growth_rate_yoy')->nullable();           // Growth Rate (YOY)
            $table->string('revenue_growth_avg_3y')->nullable();     // Revenue Growth Rate (Average Last 3 Years)
            $table->string('profit_criteria')->nullable();           // Profit Criteria

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
        Schema::dropIfExists('buyers_financial_preferences');
    }
};
