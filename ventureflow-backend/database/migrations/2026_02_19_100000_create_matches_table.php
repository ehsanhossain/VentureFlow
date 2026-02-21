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
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('buyer_id');
            $table->unsignedBigInteger('seller_id');

            // Overall weighted score (0–100)
            $table->unsignedTinyInteger('total_score')->default(0)->index();

            // Individual dimension scores (0.00–1.00)
            $table->decimal('industry_score', 5, 4)->default(0);
            $table->decimal('geography_score', 5, 4)->default(0);
            $table->decimal('financial_score', 5, 4)->default(0);
            $table->decimal('profile_score', 5, 4)->default(0);
            $table->decimal('timeline_score', 5, 4)->default(0);
            $table->decimal('ownership_score', 5, 4)->default(0);

            // Status management
            $table->enum('status', ['pending', 'reviewed', 'dismissed', 'converted'])->default('pending');
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->unsignedBigInteger('deal_id')->nullable();
            $table->text('notes')->nullable();

            $table->timestamp('computed_at')->useCurrent();
            $table->timestamps();

            // One match record per pair
            $table->unique(['buyer_id', 'seller_id']);

            // Foreign keys
            $table->foreign('buyer_id')->references('id')->on('buyers')->onDelete('cascade');
            $table->foreign('seller_id')->references('id')->on('sellers')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('deal_id')->references('id')->on('deals')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
