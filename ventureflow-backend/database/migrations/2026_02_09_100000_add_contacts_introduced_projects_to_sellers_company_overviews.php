<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add missing columns to sellers_company_overviews
     * for parity with the redesigned TargetRegistration form.
     */
    public function up(): void
    {
        Schema::table('sellers_company_overviews', function (Blueprint $table) {
            $table->json('contacts')->nullable()->after('seller_phone');
            $table->json('introduced_projects')->nullable()->after('channel');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sellers_company_overviews', function (Blueprint $table) {
            $table->dropColumn(['contacts', 'introduced_projects']);
        });
    }
};
