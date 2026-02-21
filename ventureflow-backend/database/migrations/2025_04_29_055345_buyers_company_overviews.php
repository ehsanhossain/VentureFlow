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
            $table->string('reg_name', 255)->nullable();
            $table->string('hq_country', 100)->nullable();
            $table->string('company_type', 100)->nullable();
            $table->string('year_founded', 100)->nullable();
            $table->string('industry_ops', 255)->nullable();
            $table->json('main_industry_operations')->nullable();
            $table->json('niche_industry')->nullable();
            $table->string('emp_count')->nullable();

            // M&A Details
            $table->string('reason_ma')->nullable();
            $table->string('proj_start_date')->nullable();
            $table->string('txn_timeline')->nullable();

            // Internal In-Charge
            $table->string('incharge_name', 100)->nullable();
            $table->boolean('no_pic_needed')->nullable()->default(false);

            // Status & Meta
            $table->string('status', 50)->nullable();
            $table->text('details')->nullable();

            // Contact Info - Company
            $table->string('email', 150)->nullable();
            $table->string('phone', 50)->nullable();
            $table->json('hq_address')->nullable();
            $table->json('shareholder_name')->nullable();

            // Seller Contact - Primary
            $table->string('seller_contact_name', 100)->nullable();
            $table->string('seller_designation', 100)->nullable();
            $table->string('seller_email', 150)->nullable();
            $table->json('seller_phone')->nullable();

            // Online Presence
            $table->string('website', 255)->nullable();
            $table->string('linkedin', 255)->nullable();
            $table->string('twitter', 255)->nullable();
            $table->string('facebook', 255)->nullable();
            $table->string('instagram', 255)->nullable();
            $table->string('youtube', 255)->nullable();


            $table->timestamps();
        });
    }



    public function down(): void
    {
        Schema::dropIfExists('buyers_company_overviews');
    }
};
