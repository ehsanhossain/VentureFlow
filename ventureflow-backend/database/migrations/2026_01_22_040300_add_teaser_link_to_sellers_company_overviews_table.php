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
        Schema::table('sellers_company_overviews', function (Blueprint $table) {
            $table->string('teaser_link')->nullable()->after('website');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sellers_company_overviews', function (Blueprint $table) {
            $table->dropColumn('teaser_link');
        });
    }
};
