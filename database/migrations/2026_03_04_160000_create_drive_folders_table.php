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
        Schema::create('drive_folders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->uuid('parent_id')->nullable();
            $table->foreign('parent_id')->references('id')->on('drive_folders')->onDelete('cascade');
            $table->enum('prospect_type', ['investor', 'target']);
            $table->unsignedBigInteger('prospect_id');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['prospect_type', 'prospect_id']);
            $table->index(['parent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drive_folders');
    }
};
