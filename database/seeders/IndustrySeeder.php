<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IndustrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $industries = [
            'Agriculture, Forestry, Fishing, and Hunting',
            'Mining, Quarrying, and Oil and Gas Extraction',
            'Utilities',
            'Construction',
            'Waste Management and Remediation Services',
            'Manufacturing',
            'Information and Communications',
            'Transportation and Logistics',
            'Wholesale Trade',
            'Retail Trade',
            'Finance and Insurance',
            'Real Estate and Rental',
            'Professional, Scientific, and Technical Services',
            'Management of Companies and Enterprises',
            'Administrative and Support Services',
            'Educational Services',
            'Healthcare and Social Assistance',
            'Arts, Entertainment, and Recreation',
            'Accommodation and Food Services',
            'Other Services',
            'Public Administration',
            'Unclassifiable Industries',
        ];

        foreach ($industries as $industry) {
            DB::table('industries')->insert([
                'name' => $industry,
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
