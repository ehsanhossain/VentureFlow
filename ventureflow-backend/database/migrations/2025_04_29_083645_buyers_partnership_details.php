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
        Schema::create('buyers_partnership_details', function (Blueprint $table) {
            $table->id();

            $table->boolean('partnership_affiliation')->default(false);

            $table->string('partner')->nullable();
            $table->string('referral_bonus_criteria')->nullable();
            $table->string('referral_bonus_amount')->nullable();
            $table->string('mou_status')->nullable();
            $table->text('specific_remarks')->nullable();

            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('buyers_partnership_details');
    }
};
