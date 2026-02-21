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
            $table->string('teaser_heading')->nullable();
            $table->json('b_in')->nullable();
            $table->json('target_countries')->nullable();
            $table->string('emp_count_range')->nullable();
            $table->json('expected_ebitda')->nullable();
            $table->json('acquire_pct')->nullable();
            $table->json('valuation_range')->nullable();
            $table->string('investment_amount')->nullable();
            $table->string('growth_rate_yoy')->nullable();
             $table->text('teaser_details')->nullable();
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
