<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Deal;
use App\Models\Seller;
use App\Models\Buyer;
use App\Models\Employee;
use App\Models\Partner;
use App\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->query('query');

        if (!$query) {
            return response()->json([
                'deals' => [],
                'investors' => [],
                'targets' => [],
                'staff' => [],
                'partners' => [],
            ]);
        }

        // Search Deals
        $deals = [];
        try {
            $deals = Deal::where('name', 'like', "%{$query}%")
                ->orWhereHas('buyer.companyOverview', function ($q) use ($query) {
                    $q->where('reg_name', 'like', "%{$query}%");
                })
                ->orWhereHas('seller.companyOverview', function ($q) use ($query) {
                    $q->where('reg_name', 'like', "%{$query}%");
                })
                ->take(5)
                ->get();
        } catch (\Exception $e) {
            Log::warning('Search: Deals query failed — ' . $e->getMessage());
        }

        // Search Sellers (Targets)
        $mappedSellers = [];
        try {
            $sellers = Seller::where('seller_id', 'like', "%{$query}%")
                ->orWhereHas('companyOverview', function ($q) use ($query) {
                    $q->where('reg_name', 'like', "%{$query}%")
                      ->orWhere('website', 'like', "%{$query}%");
                })
                ->orWhereHas('companyOverview.hqCountry', function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%");
                })
                ->with(['companyOverview', 'companyOverview.hqCountry'])
                ->take(5)
                ->get();

            $mappedSellers = $sellers->map(function ($seller) {
                return [
                    'id' => $seller->id,
                    'name' => $seller->companyOverview->reg_name ?? 'Unknown Target',
                    'project_code' => $seller->seller_id ?? '',
                    'country' => $seller->companyOverview->hqCountry->name ?? '',
                    'country_flag' => $seller->companyOverview->hqCountry->svg_icon_url ?? '',
                    'avatar_url' => $seller->image ? asset('storage/' . $seller->image) : null,
                    'type' => 'Target'
                ];
            });
        } catch (\Exception $e) {
            Log::warning('Search: Targets query failed — ' . $e->getMessage());
        }

        // Search Buyers (Investors)
        $mappedBuyers = [];
        try {
            $buyers = Buyer::where('buyer_id', 'like', "%{$query}%")
                ->orWhereHas('companyOverview', function ($q) use ($query) {
                    $q->where('reg_name', 'like', "%{$query}%")
                      ->orWhere('website', 'like', "%{$query}%");
                })
                ->orWhereHas('companyOverview.hqCountry', function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%");
                })
                ->with(['companyOverview', 'companyOverview.hqCountry'])
                ->take(5)
                ->get();

            $mappedBuyers = $buyers->map(function ($buyer) {
                return [
                    'id' => $buyer->id,
                    'name' => $buyer->companyOverview->reg_name ?? 'Unknown Investor',
                    'project_code' => $buyer->buyer_id ?? '',
                    'country' => $buyer->companyOverview->hqCountry->name ?? '',
                    'country_flag' => $buyer->companyOverview->hqCountry->svg_icon_url ?? '',
                    'avatar_url' => $buyer->image ? asset('storage/' . $buyer->image) : null,
                    'type' => 'Investor'
                ];
            });
        } catch (\Exception $e) {
            Log::warning('Search: Investors query failed — ' . $e->getMessage());
        }

        // Search Staff (Employees)
        $mappedStaff = [];
        try {
            $employees = Employee::where('first_name', 'like', "%{$query}%")
                ->orWhere('last_name', 'like', "%{$query}%")
                ->orWhere('work_email', 'like', "%{$query}%")
                ->take(5)
                ->get();

            $mappedStaff = $employees->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'first_name' => $emp->first_name,
                    'last_name' => $emp->last_name,
                    'work_email' => $emp->work_email,
                    'avatar_url' => $emp->image ? asset('storage/' . $emp->image) : null,
                ];
            });
        } catch (\Exception $e) {
            Log::warning('Search: Staff query failed — ' . $e->getMessage());
        }

        // Search Partners
        $mappedPartners = [];
        try {
            $partners = Partner::whereHas('partnerOverview', function ($q) use ($query) {
                    $q->where('reg_name', 'like', "%{$query}%");
                })
                ->orWhere('partner_id', 'like', "%{$query}%")
                ->with('partnerOverview')
                ->take(5)
                ->get();

            $mappedPartners = $partners->map(function ($partner) {
                return [
                    'id' => $partner->id,
                    'name' => $partner->partnerOverview->reg_name ?? 'Unknown Partner',
                    'partner_id' => $partner->partner_id ?? '',
                    'avatar_url' => $partner->partner_image ? asset('storage/' . $partner->partner_image) : null,
                ];
            });
        } catch (\Exception $e) {
            Log::warning('Search: Partners query failed — ' . $e->getMessage());
        }

        return response()->json([
            'deals' => $deals,
            'investors' => $mappedBuyers,
            'targets' => $mappedSellers,
            'staff' => $mappedStaff,
            'partners' => $mappedPartners,
        ]);
    }
}
