<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace Database\Seeders;

use App\Models\FeeTier;
use Illuminate\Database\Seeder;

class FeeTierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing data
        FeeTier::truncate();

        // ── Investor Fee Tiers ──
        $investorTiers = [
            ['min' => 0,           'max' => 1000000,    'fee' => 100000,   'retainer' => '$2,000/mo (Starts from LOI signing)'],
            ['min' => 1000000,     'max' => 5000000,    'fee' => 300000,   'retainer' => '$20,000 one-time (Paid before DD starts)'],
            ['min' => 5000000,     'max' => 10000000,   'fee' => 500000,   'retainer' => 'All retainers are credited against Success Fee'],
            ['min' => 10000000,    'max' => 20000000,   'fee' => 700000,   'retainer' => null],
            ['min' => 20000000,    'max' => 50000000,   'fee' => 1000000,  'retainer' => null],
            ['min' => 50000000,    'max' => 100000000,  'fee' => 3000000,  'retainer' => null],
            ['min' => 100000000,   'max' => null,        'fee' => 5000000,  'retainer' => null],
        ];

        foreach ($investorTiers as $i => $tier) {
            FeeTier::create([
                'fee_type' => 'investor',
                'min_amount' => $tier['min'],
                'max_amount' => $tier['max'],
                'success_fee_fixed' => $tier['fee'],
                'success_fee_rate' => null,
                'retainer_details' => $tier['retainer'],
                'fee_constraints' => null,
                'order_index' => $i,
                'is_active' => true,
            ]);
        }

        // ── Target Fee Tiers ──
        $targetTiers = [
            ['min' => 0,           'max' => 1000000,    'rate' => 5.0,  'constraint' => 'Absolutely no retainer or upfront fees'],
            ['min' => 1000000,     'max' => 10000000,   'rate' => 3.0,  'constraint' => 'Calculated only upon successful closing'],
            ['min' => 10000000,    'max' => 30000000,   'rate' => 2.5,  'constraint' => 'Transaction value = Basis of calculation'],
            ['min' => 30000000,    'max' => 50000000,   'rate' => 2.0,  'constraint' => null],
            ['min' => 50000000,    'max' => 100000000,  'rate' => 1.5,  'constraint' => null],
            ['min' => 100000000,   'max' => null,        'rate' => 1.0,  'constraint' => null],
        ];

        foreach ($targetTiers as $i => $tier) {
            FeeTier::create([
                'fee_type' => 'target',
                'min_amount' => $tier['min'],
                'max_amount' => $tier['max'],
                'success_fee_fixed' => null,
                'success_fee_rate' => $tier['rate'],
                'retainer_details' => null,
                'fee_constraints' => $tier['constraint'],
                'order_index' => $i,
                'is_active' => true,
            ]);
        }
    }
}
