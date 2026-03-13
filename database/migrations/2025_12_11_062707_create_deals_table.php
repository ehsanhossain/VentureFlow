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
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Main deals table
        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buyer_id')->constrained('buyers')->onDelete('cascade');
            $table->foreignId('seller_id')->constrained('sellers')->onDelete('cascade');
            $table->string('name');
            $table->string('industry')->nullable();
            $table->string('region')->nullable();
            $table->decimal('estimated_ev_value', 15, 2)->nullable();
            $table->string('estimated_ev_currency', 3)->default('USD');
            $table->char('stage_code', 1)->default('K'); // K, J, I, H, G, F, E, D, C, B, A
            $table->tinyInteger('progress_percent')->default(5);
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->foreignId('pic_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('target_close_date')->nullable();
            $table->enum('status', ['active', 'on_hold', 'lost', 'won'])->default('active');
            $table->integer('comment_count')->default(0);
            $table->integer('attachment_count')->default(0);
            $table->timestamps();
            
            $table->index('stage_code');
            $table->index('status');
        });

        // Stage history for tracking movements
        Schema::create('deal_stage_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->onDelete('cascade');
            $table->char('from_stage', 1)->nullable();
            $table->char('to_stage', 1);
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at')->useCurrent();
        });

        // Deal documents
        Schema::create('deal_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->onDelete('cascade');
            $table->enum('document_type', ['NDA', 'IM', 'LOI', 'SPA', 'DD_REPORT', 'OTHER'])->default('OTHER');
            $table->string('file_name');
            $table->string('file_path');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Deal comments
        Schema::create('deal_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->onDelete('cascade');
            $table->text('comment_body');
            $table->foreignId('commented_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deal_comments');
        Schema::dropIfExists('deal_documents');
        Schema::dropIfExists('deal_stage_history');
        Schema::dropIfExists('deals');
    }
};
