<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('partners_partner_overviews', function (Blueprint $table) {
            $table->id();

            // Basic Details
            $table->string('reg_name', 255)->nullable();
            $table->foreignId('hq_country')->nullable()->constrained('countries');
            $table->string('company_type', 100)->nullable();
            $table->string('year_founded', 100)->nullable();
            $table->json('main_countries')->nullable();

            $table->json('niche_industry')->nullable();
            $table->string('current_employee_count', 100)->nullable();
            $table->foreignId('our_contact_person')->nullable()->constrained('employees');

            // General Contact Info - Company
            $table->string('company_email', 150)->nullable();
            $table->string('company_phone', 50)->nullable();
            $table->json('hq_address')->nullable();
            $table->json('shareholder_name')->nullable();

            //Contact Person Details
            $table->string('contact_person_name', 150)->nullable();
            $table->string('contact_person_position', 150)->nullable();
            $table->string('contact_person_email', 150)->nullable();
            $table->json('contact_person_phone')->nullable();

            // Online Presence
            $table->string('website', 255)->nullable();
            $table->string('linkedin', 255)->nullable();
            $table->string('twitter', 255)->nullable();
            $table->string('facebook', 255)->nullable();
            $table->string('instagram', 255)->nullable();
            $table->string('youtube', 255)->nullable();

            //Details
            $table->text('details')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partners_partner_overview');
    }
};
