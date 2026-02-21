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
        Schema::create('buyers_target_preferences', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->json('b_ind_prefs')->nullable();
            $table->json('n_ind_prefs')->nullable();
            $table->json('target_countries')->nullable();
            $table->string('main_market')->nullable();
            $table->string('emp_count_range')->nullable();
            $table->string('mgmt_retention')->nullable();
            $table->string('years_in_biz')->nullable();
            $table->string('timeline')->nullable();
            $table->string('company_type')->nullable();
            $table->json('cert')->nullable();

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
        Schema::dropIfExists('buyers_target_preferences');
    }
};
