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
        Schema::table('buyers_company_overviews', function (Blueprint $table) {
            $table->string('channel')->nullable();
        });

        Schema::table('sellers_company_overviews', function (Blueprint $table) {
            $table->string('channel')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buyers_company_overviews', function (Blueprint $table) {
            $table->dropColumn('channel');
        });

        Schema::table('sellers_company_overviews', function (Blueprint $table) {
            $table->dropColumn('channel');
        });
    }
};
