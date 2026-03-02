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
            $table->string('reg_name', 255)->nullable();                           // Company Registered Name
            $table->foreignId('hq_country')->nullable()->constrained('countries');                   // HQ/Origin Country
            $table->string('company_type', 100)->nullable();                  // Company Type
            $table->string('year_founded', 100)->nullable();                  // Year Founded
            $table->json('main_countries')->nullable();

            $table->json('niche_industry')->nullable();                   // Niche / Priority Industry
            $table->string('current_employee_count', 100)->nullable();
            $table->foreignId('our_contact_person')->nullable()->constrained('employees');              // Employee Incharge

            // General Contact Info - Company
            $table->string('company_email', 150)->nullable();                 // Company’s Email
            $table->string('company_phone', 50)->nullable();                  // Company’s Phone Number
            $table->json('hq_address')->nullable();                                 // HQ Address
            $table->json('shareholder_name')->nullable();

            //Contact Person Details
            $table->string('contact_person_name', 150)->nullable();
            $table->string('contact_person_position', 150)->nullable();
            $table->string('contact_person_email', 150)->nullable();
            $table->json('contact_person_phone')->nullable();

            // Online Presence
            $table->string('website', 255)->nullable();               // Website Link
            $table->string('linkedin', 255)->nullable();              // LinkedIn Link
            $table->string('twitter', 255)->nullable();               // X (Twitter) Link
            $table->string('facebook', 255)->nullable();              // Facebook Link
            $table->string('instagram', 255)->nullable();             // Instagram Link
            $table->string('youtube', 255)->nullable();               // YouTube Link

            //Details
            $table->text('details')->nullable(); // Additional Details

            $table->timestamps();                                                     // Created At & Updated At
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
