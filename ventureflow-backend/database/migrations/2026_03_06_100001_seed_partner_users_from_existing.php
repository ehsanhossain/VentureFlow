<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Copy all existing partners.user_id mappings into the new partner_users pivot table.
     * Each existing user is marked as is_primary = true.
     * This is additive only — no columns are dropped.
     */
    public function up(): void
    {
        $partners = DB::table('partners')->whereNotNull('user_id')->get();

        foreach ($partners as $partner) {
            DB::table('partner_users')->insertOrIgnore([
                'partner_id' => $partner->id,
                'user_id'    => $partner->user_id,
                'is_primary' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // The partner_users table will be dropped by the previous migration's down()
        // No action needed here
    }
};
