<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CompanySeeder extends Seeder
{
    public function run()
    {
        $companies = [
            'TOKYO CONSULTING FIRM LIMITED BANGLADESH',
            'TOKYO CONSULTING FIRM LIMITED BRAZIL',
            'TOKYO CONSULTING FIRM LIMITED CHINA',
            'TOKYO CONSULTING FIRM LIMITED CAMBODIA',
            'TOKYO CONSULTING FIRM LIMITED COLUMBIA',
            'TOKYO CONSULTING FIRM LIMITED HONG KONG',
            'TOKYO CONSULTING FIRM LIMITED INDIA',
            'TOKYO CONSULTING FIRM LIMITED INDONESIA',
            'TOKYO CONSULTING FIRM LIMITED JAPAN',
            'TOKYO CONSULTING FIRM LIMITED KENYA',
            'TOKYO CONSULTING FIRM LIMITED LAOS',
            'TOKYO CONSULTING FIRM LIMITED MALAYSIA',
            'TOKYO CONSULTING FIRM LIMITED MYANMAR',
            'TOKYO CONSULTING FIRM LIMITED MEXICO',
            'TOKYO CONSULTING FIRM LIMITED MOROCCO',
            'TOKYO CONSULTING FIRM LIMITED MONGOLIA',
            'TOKYO CONSULTING FIRM LIMITED NIGERIA',
            'TOKYO CONSULTING FIRM LIMITED PHILIPPINES',
            'TOKYO CONSULTING FIRM LIMITED PERU',
            'TOKYO CONSULTING FIRM LIMITED RUSSIA',
            'TOKYO CONSULTING FIRM LIMITED SINGAPORE',
            'TOKYO CONSULTING FIRM LIMITED SRI LANKA',
            'TOKYO CONSULTING FIRM LIMITED SOUTH AFRICA',
            'TOKYO CONSULTING FIRM LIMITED THAILAND',
            'TOKYO CONSULTING FIRM LIMITED TURKEY',
            'TOKYO CONSULTING FIRM LIMITED VIETNAM',
        ];

        foreach ($companies as $company) {
            DB::table('companies')->insert([
                'name' => $company,
            ]);
        }
    }
}

