<?php

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
        Schema::create('deal_fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->onDelete('cascade');
            $table->foreignId('fee_tier_id')->nullable()->constrained('fee_tiers')->nullOnDelete();
            $table->string('stage_code', 2);
            $table->enum('fee_side', ['investor', 'target']);
            $table->enum('fee_type', ['success', 'retainer', 'monthly', 'one_time']);
            $table->decimal('calculated_amount', 20, 2);   // System-computed default
            $table->decimal('final_amount', 20, 2);         // What the user confirmed (may differ)
            $table->boolean('deducted_from_success')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deal_fees');
    }
};
