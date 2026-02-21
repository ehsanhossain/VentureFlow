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
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('name'); 
            $table->string('alpha_2_code', 2)->unique(); // Alpha-2 code (e.g., US)
            $table->string('alpha_3_code', 3)->unique(); // Alpha-3 code (e.g., USA)
            $table->integer('numeric_code')->unique(); // Numeric code (e.g., 840 for USA)
            $table->string('svg_icon')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
