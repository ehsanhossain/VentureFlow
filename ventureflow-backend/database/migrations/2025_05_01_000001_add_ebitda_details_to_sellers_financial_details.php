<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sellers_financial_details', function (Blueprint $table) {
            $table->text('ebitda_details')->nullable()->after('ebitda_value');
        });
    }

    public function down(): void
    {
        Schema::table('sellers_financial_details', function (Blueprint $table) {
            $table->dropColumn('ebitda_details');
        });
    }
};
