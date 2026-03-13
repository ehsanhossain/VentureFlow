<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->decimal('ebitda_investor_value', 20, 2)->nullable()->after('investment_condition');
            $table->decimal('ebitda_investor_times', 10, 2)->nullable()->after('ebitda_investor_value');
            $table->decimal('ebitda_target_value', 20, 2)->nullable()->after('ebitda_investor_times');
            $table->decimal('ebitda_target_times', 10, 2)->nullable()->after('ebitda_target_value');
        });
    }

    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->dropColumn([
                'ebitda_investor_value',
                'ebitda_investor_times',
                'ebitda_target_value',
                'ebitda_target_times',
            ]);
        });
    }
};
