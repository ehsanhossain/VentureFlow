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
        Schema::create('buyers_company_overviews', function (Blueprint $table) {
            $table->id();

            // Company Identification & Basics
            $table->string('reg_name', 255)->nullable();              // Company Registered Name
            $table->string('hq_country', 100)->nullable();            // HQ/Origin Country
            $table->string('company_type', 100)->nullable();          // Company Type
            $table->string('year_founded', 100)->nullable();
            $table->string('industry_ops', 255)->nullable();          // Broader Industry Operations
            $table->json('main_industry_operations')->nullable();
            $table->json('niche_industry')->nullable();               // Niche / Priority Industry
            $table->string('emp_count')->nullable();                  // Current Employee Counts

            // M&A Details
            $table->string('reason_ma')->nullable();
            $table->string('proj_start_date')->nullable();            // Project Start Date
            $table->string('txn_timeline')->nullable();               // Expected Transaction Timeline

            // Internal In-Charge
            $table->string('incharge_name', 100)->nullable();         // Our Person In-charge
            $table->boolean('no_pic_needed')->nullable()->default(false); // No PIC Needed

            // Status & Meta
            $table->string('status', 50)->nullable();                 // Status
            $table->text('details')->nullable();                      // Details

            // Contact Info - Company
            $table->string('email', 150)->nullable();                 // Company’s Email
            $table->string('phone', 50)->nullable();                  // Company’s Phone Number
            $table->json('hq_address')->nullable();                   // HQ Address
            $table->json('shareholder_name')->nullable();

            // Seller Contact - Primary
            $table->string('seller_contact_name', 100)->nullable();   // Seller Side Contact Person Name
            $table->string('seller_designation', 100)->nullable();    // Designation & Position
            $table->string('seller_email', 150)->nullable();          // Email Address
            $table->json('seller_phone')->nullable();                 // Phone Number

            // Online Presence
            $table->string('website', 255)->nullable();               // Website Link
            $table->string('linkedin', 255)->nullable();              // LinkedIn Link
            $table->string('twitter', 255)->nullable();               // X (Twitter) Link
            $table->string('facebook', 255)->nullable();              // Facebook Link
            $table->string('instagram', 255)->nullable();             // Instagram Link
            $table->string('youtube', 255)->nullable();               // YouTube Link

            // Seller Meta
            // $table->unsignedBigInteger('buyer_id')->nullable();      // Seller ID
            // $table->text('buyer_image')->nullable();                 // Seller Image

            $table->timestamps();                                     // Created At & Updated At
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('buyers_company_overviews');
    }
};
