<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_table_preferences', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('table_type', 20); // 'investor' or 'target'
            $table->json('visible_columns');   // ordered array of visible column IDs
            $table->json('column_order');      // full ordered array of ALL column IDs (including hidden)
            $table->timestamps();

            $table->unique(['user_id', 'table_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_table_preferences');
    }
};
