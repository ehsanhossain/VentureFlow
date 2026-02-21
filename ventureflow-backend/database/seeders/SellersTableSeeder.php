<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SellersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = \Faker\Factory::create();

        // Get some country IDs if available
        $countryIds = DB::table('countries')->pluck('id')->toArray();
        if (empty($countryIds)) {
            $countryIds = [1];
        }
        
        // Get some employee IDs for PICs
        $employeeIds = DB::table('employees')->pluck('id')->toArray();

        for ($i = 0; $i < 20; $i++) {
            // 1. Create Company Overview
            $companyOverviewId = DB::table('sellers_company_overviews')->insertGetId([
                'reg_name' => $faker->company,
                'hq_country' => $faker->randomElement($countryIds),
                'company_type' => $faker->randomElement(['Private', 'Public', 'Subsidiary']),
                'year_founded' => $faker->year,
                'industry_ops' => json_encode([$faker->word, $faker->word]),
                'niche_industry' => json_encode(['SaaS', 'Fintech']),
                'emp_total' => $faker->numberBetween(10, 2000),
                'reason_ma' => json_encode([$faker->sentence]),
                'synergies' => $faker->paragraph,
                'proj_start_date' => $faker->date(),
                'txn_timeline' => $faker->randomElement(['Q3 2025', 'Q4 2025', 'Flexible']),
                'incharge_name' => !empty($employeeIds) ? $faker->randomElement($employeeIds) : null,
                'no_pic_needed' => $faker->boolean(20),
                'status' => json_encode(['Active']),
                'details' => $faker->paragraph,
                'email' => $faker->companyEmail,
                'phone' => $faker->phoneNumber,
                'hq_address' => json_encode([['address' => $faker->address]]),
                'shareholder_name' => json_encode([['name' => $faker->name], ['name' => $faker->name]]),
                'website' => $faker->url,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Create Seller linked to above
            DB::table('sellers')->insert([
                'seller_id' => 'S' . $faker->unique()->numberBetween(1000, 9999),
                'company_overview_id' => $companyOverviewId,
                'status' => '1',
                'pinned' => $faker->boolean(10),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
