<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {



    public function up(): void
    {
        Schema::create('sellers', function (Blueprint $table) {
            $table->id();

            $table->string('seller_id')->unique();

            $table->foreignId('company_overview_id')->nullable()->constrained('sellers_company_overviews');
            $table->foreignId('financial_detail_id')->nullable()->constrained('sellers_financial_details');
            $table->foreignId('partnership_detail_id')->nullable()->constrained('sellers_partnership_details');
            $table->foreignId('teaser_center_id')->nullable()->constrained('sellers_teaser_centers');
            $table->string('image')->nullable();
            $table->string('status')->nullable();
            $table->boolean('pinned')->nullable()->default(false);
            $table->timestamps();
        });

    }


    public function down(): void
    {
        Schema::dropIfExists('sellers');
    }
};
