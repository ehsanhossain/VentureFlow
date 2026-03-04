<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


use Illuminate\Database\Console\Migrations\StatusCommand;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('buyers', function (Blueprint $table) {
            $table->id();

            $table->string('buyer_id')->unique(); // Optional unique identifier

            $table->foreignId('company_overview_id')->nullable()->constrained('buyers_company_overviews');
            $table->foreignId('target_preference_id')->nullable()->constrained('buyers_target_preferences');
            $table->foreignId('financial_detail_id')->nullable()->constrained('buyers_financial_details');
            $table->foreignId('partnership_detail_id')->nullable()->constrained('buyers_partnership_details');
            $table->foreignId('teaser_center_id')->nullable()->constrained('buyers_teaser_centers');
            $table->string('image')->nullable();
            $table->string('status')->nullable();
            $table->boolean('pinned')->nullable()->default(false);
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('buyers');
    }
};
