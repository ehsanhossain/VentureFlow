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
            $table->string('default_currency')->nullable();
            $table->string('register_currency')->nullable();
            $table->string('related_country')->nullable();

            $table->json('investment_budget')->nullable();
            $table->string('ebitda_margin_latest')->nullable();
            $table->json('ebitda_multiple')->nullable();


            $table->json('expected_ebitda')->nullable();
            $table->json('profit_multiple')->nullable();
            $table->json('ttm_revenue')->nullable();
            $table->json('ttm_profit')->nullable();

            $table->string('ma_structure')->nullable();
            $table->json('shareholding')->nullable();
            $table->json('acquire_pct')->nullable();
            //Round Estimation Criteria
            $table->boolean('is_minority')->nullable()->default(false);
            $table->boolean('is_majority')->nullable()->default(false);
            $table->boolean('is_negotiable')->nullable()->default(false);


            $table->string('ownership_type')->nullable();

            $table->json('valuation')->nullable();

            $table->string('growth_rate_yoy')->nullable();
            $table->string('revenue_growth_avg_3y')->nullable();
            $table->string('profit_criteria')->nullable();

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
