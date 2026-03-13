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

    public function up(): void
    {
        Schema::create('partners_partnership_structures', function (Blueprint $table) {
            $table->id();
            $table->string('partnership_structure')->nullable();
            $table->string('commission_criteria')->nullable();
            $table->string('status')->nullable();
            $table->foreignId('partnership_coverage_range')->nullable();
            $table->string('mou_status')->nullable();
            $table->timestamps();
        });
    }



    public function down(): void
    {
        Schema::dropIfExists('partners_partnership_structures');
    }
};
