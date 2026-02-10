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
        Schema::table('sellers_financial_details', function (Blueprint $table) {
            $table->text('investment_condition')->nullable()->after('expected_investment_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sellers_financial_details', function (Blueprint $table) {
            $table->dropColumn('investment_condition');
        });
    }
};
