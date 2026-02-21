<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\PipelineStage;

class PipelineStageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing stages
        PipelineStage::truncate();

        $buyerStages = [
            ['code' => 'K', 'name' => 'Buyer Sourcing', 'progress' => 5],
            ['code' => 'J', 'name' => 'Onboarding', 'progress' => 10],
            ['code' => 'I', 'name' => 'Target Sourcing', 'progress' => 20],
            ['code' => 'H', 'name' => 'Interest Check', 'progress' => 30],
            ['code' => 'G', 'name' => 'NDA & IM Delivery', 'progress' => 40],
            ['code' => 'F', 'name' => 'Top Meeting & IOI', 'progress' => 50],
            ['code' => 'E', 'name' => 'LOI / Exclusivity', 'progress' => 65],
            ['code' => 'D', 'name' => 'Due Diligence', 'progress' => 80],
            ['code' => 'C', 'name' => 'SPA Negotiation', 'progress' => 90],
            ['code' => 'B', 'name' => 'Deal Closing', 'progress' => 95],
            ['code' => 'A', 'name' => 'Success', 'progress' => 100],
        ];

        $sellerStages = [
            ['code' => 'K', 'name' => 'Seller Company Sourcing', 'progress' => 5],
            ['code' => 'J', 'name' => 'On-boarding', 'progress' => 10],
            ['code' => 'I', 'name' => 'Teaser & Buyer Outreach', 'progress' => 20],
            ['code' => 'H', 'name' => 'End-to-end NDA & IM Release', 'progress' => 30],
            ['code' => 'G', 'name' => 'Top Meetings & IOI', 'progress' => 50],
            ['code' => 'F', 'name' => 'LOI Negotiation', 'progress' => 65],
            ['code' => 'E', 'name' => 'Due Diligence Management', 'progress' => 80],
            ['code' => 'D', 'name' => 'SPA Drafting & Negotiation', 'progress' => 90],
            ['code' => 'C', 'name' => 'Deal Closing & PIM', 'progress' => 95],
            ['code' => 'B', 'name' => 'Success', 'progress' => 100],
        ];

        foreach ($buyerStages as $index => $stage) {
            PipelineStage::create(array_merge($stage, [
                'pipeline_type' => 'buyer',
                'order_index' => $index,
                'is_active' => true,
            ]));
        }

        foreach ($sellerStages as $index => $stage) {
            PipelineStage::create(array_merge($stage, [
                'pipeline_type' => 'seller',
                'order_index' => $index,
                'is_active' => true,
            ]));
        }
    }
}
