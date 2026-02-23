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
        Schema::create('partners', function (Blueprint $table) {
            $table->id();

            $table->string('partner_id')->unique();
            $table->string('partner_image')->nullable();

            $table->foreignId('partnership_structure_id')
                ->nullable()
                ->constrained('partners_partnership_structures');

            $table->foreignId('partner_overview_id')
                ->nullable()
                ->constrained('partners_partner_overviews');
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
        Schema::dropIfExists('partners');
    }
};
