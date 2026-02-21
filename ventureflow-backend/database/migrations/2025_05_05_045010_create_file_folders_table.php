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
        Schema::create('file_folders', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('folder_id')->nullable();
            $table->foreign('folder_id')
                ->references('id')
                ->on('folders')
                ->onDelete('cascade');

            $table->uuid('file_id')->nullable();
            $table->foreign('file_id')
                ->references('id')
                ->on('files')
                ->onDelete('set null');

            $table->foreignId('seller_id')->nullable()->constrained('sellers');
            $table->foreignId('buyer_id')->nullable()->constrained('buyers');
            $table->foreignId('partner_id')->nullable()->constrained('partners');

            $table->timestamps();
        });
    }



    public function down(): void
    {
        Schema::dropIfExists('file_folders');
    }
};
