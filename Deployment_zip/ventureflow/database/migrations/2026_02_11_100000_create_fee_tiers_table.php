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
        Schema::create('fee_tiers', function (Blueprint $table) {
            $table->id();
            $table->enum('fee_type', ['investor', 'target']);
            $table->decimal('min_amount', 20, 2);
            $table->decimal('max_amount', 20, 2)->nullable(); // null = "and above"
            $table->decimal('success_fee_fixed', 20, 2)->nullable(); // investor: fixed dollar fee
            $table->decimal('success_fee_rate', 5, 2)->nullable();   // target: percentage fee
            $table->text('retainer_details')->nullable();            // investor: retainer notes
            $table->text('fee_constraints')->nullable();             // target: constraint notes
            $table->integer('order_index');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_tiers');
    }
};
