<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow 1-sided deals: buyer_id and seller_id are now nullable
     * to support mandate/search workflows where counterparty is TBD.
     */
    public function up(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            // Drop existing foreign key constraints
            $table->dropForeign(['buyer_id']);
            $table->dropForeign(['seller_id']);

            // Make columns nullable
            $table->unsignedBigInteger('buyer_id')->nullable()->change();
            $table->unsignedBigInteger('seller_id')->nullable()->change();

            // Re-add foreign keys with nullable support
            $table->foreign('buyer_id')->references('id')->on('buyers')->onDelete('cascade');
            $table->foreign('seller_id')->references('id')->on('sellers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->dropForeign(['buyer_id']);
            $table->dropForeign(['seller_id']);

            $table->unsignedBigInteger('buyer_id')->nullable(false)->change();
            $table->unsignedBigInteger('seller_id')->nullable(false)->change();

            $table->foreign('buyer_id')->references('id')->on('buyers')->onDelete('cascade');
            $table->foreign('seller_id')->references('id')->on('sellers')->onDelete('cascade');
        });
    }
};
