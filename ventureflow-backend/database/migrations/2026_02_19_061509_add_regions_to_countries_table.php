<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds an 'is_region' flag and makes ISO code columns nullable
     * so we can store region/group entries (ASEAN, Global, Europe, etc.)
     * alongside real countries in the same table.
     */
    public function up(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->boolean('is_region')->default(false)->after('svg_icon');
        });

        // Make code columns nullable for regions (they don't have ISO codes)
        // Drop existing unique constraints first, then re-add as nullable unique
        Schema::table('countries', function (Blueprint $table) {
            $table->string('alpha_2_code', 2)->nullable()->change();
            $table->string('alpha_3_code', 3)->nullable()->change();
            $table->integer('numeric_code')->nullable()->change();
        });

        // Drop unique indexes (they conflict with multiple NULLs)
        try {
            Schema::table('countries', function (Blueprint $table) {
                $table->dropUnique(['alpha_2_code']);
                $table->dropUnique(['alpha_3_code']);
                $table->dropUnique(['numeric_code']);
            });
        } catch (\Exception $e) {
            // Indexes may not exist, continue
        }

        // Seed the region entries
        $regions = [
            ['name' => 'Global',             'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'ASEAN',              'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'Europe',             'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'Middle East',        'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'North America',      'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'South America',      'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'Africa',             'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'Central Asia',       'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'East Asia',          'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'South Asia',         'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'Oceania',            'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'Nordic Countries',   'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
            ['name' => 'GCC',                'alpha_2_code' => null, 'alpha_3_code' => null, 'numeric_code' => null, 'svg_icon' => null, 'is_region' => true],
        ];

        $now = now();
        foreach ($regions as &$region) {
            $region['created_at'] = $now;
            $region['updated_at'] = $now;
        }

        // Only insert if they don't already exist
        foreach ($regions as $region) {
            DB::table('countries')->updateOrInsert(
                ['name' => $region['name']],
                $region
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove region entries
        DB::table('countries')->where('is_region', true)->delete();

        Schema::table('countries', function (Blueprint $table) {
            $table->dropColumn('is_region');
        });
    }
};
