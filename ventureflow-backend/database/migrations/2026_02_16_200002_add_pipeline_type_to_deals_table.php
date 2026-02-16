<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->string('pipeline_type', 10)->default('buyer')->after('stage_code');
        });

        // Backfill existing deals: if a deal has seller_id but no buyer_id, it's a seller-pipeline deal
        \DB::table('deals')
            ->whereNotNull('seller_id')
            ->whereNull('buyer_id')
            ->update(['pipeline_type' => 'seller']);
    }

    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->dropColumn('pipeline_type');
        });
    }
};
