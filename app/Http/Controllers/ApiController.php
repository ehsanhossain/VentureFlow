<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\Target;


class ApiController extends Controller
{
    public function getSellerDealInfo()
    {
        $sellers = Seller::with(['teaserCenter', 'financialDetails'])->get();

        if ($sellers->isEmpty()) {
            return response()->json([
                'message' => 'No sellers found.'
            ], 404);
        }

        $result = $sellers->map(function ($seller) {
            return [
                'id'                     => $seller->id,
                'deal_description'       => $seller->teaserCenter->teaser_details ?? null,
                'deal_room_id'           => $seller->seller_id,
                'sales_volume'           => $seller->teaserCenter->monthly_revenue ?? null,
                'desired_amount_stake'   => $seller->financialDetail->misp ?? null,
                'reason'                 => $seller->teaserCenter->selling_reason ?? null,
                'm&a_structure'          => $seller->teaserCenter->ma_structure ?? null,
                'employee_count'         => $seller->teaserCenter->current_employee_count ?? null,
                'founded'                => $seller->teaserCenter->year_founded ?? null,
            ];
        });

        return response()->json($result);
    }
}
