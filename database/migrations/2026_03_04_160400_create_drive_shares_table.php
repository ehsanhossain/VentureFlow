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
        Schema::create('drive_shares', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('file_id')->nullable();
            $table->uuid('folder_id')->nullable();
            $table->foreign('file_id')->references('id')->on('drive_files')->onDelete('cascade');
            $table->foreign('folder_id')->references('id')->on('drive_folders')->onDelete('cascade');
            $table->string('share_token', 64)->unique();
            $table->string('password_hash')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('access_count')->default(0);
            $table->unsignedInteger('max_access_count')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index('share_token');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drive_shares');
    }
};
