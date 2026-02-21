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
        Schema::create('general_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed default values
        DB::table('general_settings')->insert([
            ['key' => 'default_currency', 'value' => 'USD', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'timezone', 'value' => '(GMT+07:00) Bangkok, Hanoi, Jakarta', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'date_format', 'value' => 'DD/MM/YYYY', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('general_settings');
    }
};
