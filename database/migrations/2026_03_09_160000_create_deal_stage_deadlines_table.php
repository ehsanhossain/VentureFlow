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
        Schema::create('deal_stage_deadlines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->onDelete('cascade');
            $table->string('stage_code', 2);
            $table->enum('pipeline_type', ['buyer', 'seller']);
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['deal_id', 'stage_code', 'pipeline_type'], 'deal_stage_deadline_unique');
            $table->index(['end_date', 'is_completed'], 'deadline_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_stage_deadlines');
    }
};
