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
        Schema::create('sellers_financial_details', function (Blueprint $table) {
            $table->id();

            $table->string('default_currency')->nullable();
            $table->string('monthly_revenue')->nullable();
            $table->string('annual_revenue')->nullable();
            $table->string('operating_profit')->nullable();
            $table->string('expected_investment_amount')->nullable();
            $table->string('maximum_investor_shareholding_percentage')->nullable();
            $table->string('valuation_method')->nullable();
            $table->json('ebitda_times')->nullable();
            $table->string('ebitda_value')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sellers_financial_details');
    }


};
