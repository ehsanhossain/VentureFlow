<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BuyersTableSeeder extends Seeder
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
            $countryIds = [1]; // Fallback
        }

        // Get some employee IDs for PICs
        $employeeIds = DB::table('employees')->pluck('id')->toArray();
        
        for ($i = 0; $i < 20; $i++) {
            // 1. Create Company Overview
            $companyOverviewId = DB::table('buyers_company_overviews')->insertGetId([
                'reg_name' => $faker->company,
                'hq_country' => $faker->randomElement($countryIds),
                'company_type' => $faker->randomElement(['Corporation', 'LLC', 'Private Equity', 'Venture Capital']),
                'year_founded' => $faker->year,
                'industry_ops' => json_encode([$faker->word, $faker->word]),
                'main_industry_operations' => json_encode(['Manufacturing', 'Technology']),
                'niche_industry' => json_encode(['AI', 'Robotics']),
                'emp_count' => $faker->numberBetween(10, 5000),
                'reason_ma' => $faker->sentence,
                'proj_start_date' => $faker->date(),
                'txn_timeline' => $faker->randomElement(['Q1 2025', 'Q2 2025', 'Immediate']),
                'incharge_name' => !empty($employeeIds) ? $faker->randomElement($employeeIds) : null,
                'no_pic_needed' => $faker->boolean(20),
                'status' => '1',
                'details' => $faker->paragraph,
                'email' => $faker->companyEmail,
                'phone' => $faker->phoneNumber,
                'hq_address' => json_encode(['street' => $faker->streetAddress, 'city' => $faker->city]),
                'website' => $faker->url,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Create Financial Details
            $financialId = DB::table('buyers_financial_details')->insertGetId([
                'default_currency' => 'USD',
                'investment_budget' => json_encode(['min' => 1000000, 'max' => 50000000]),
                'ebitda_margin_latest' => $faker->randomFloat(2, 5, 30),
                'ttm_revenue' => json_encode(['value' => $faker->numberBetween(1000000, 100000000)]),
                'ownership_type' => $faker->randomElement(['Majority', 'Minority', '100%']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. Create Buyer linked to above
            DB::table('buyers')->insert([
                'buyer_id' => 'B' . $faker->unique()->numberBetween(1000, 9999),
                'company_overview_id' => $companyOverviewId,
                'financial_detail_id' => $financialId,
                'status' => '1',
                'pinned' => $faker->boolean(10),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
