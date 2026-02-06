<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Deal;
use App\Models\Seller;
use App\Models\Buyer;
use App\Models\File;
use App\Models\Employee;
use App\Models\Partner;
use App\Models\Country;
use Illuminate\Http\JsonResponse;

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
                'documents' => [],
            ]);
        }

        // Search Deals (by name or buyer/seller company name)
        $deals = Deal::where('name', 'like', "%{$query}%")
            ->orWhereHas('buyer.companyOverview', function ($q) use ($query) {
                $q->where('reg_name', 'like', "%{$query}%");
            })
            ->orWhereHas('seller.companyOverview', function ($q) use ($query) {
                $q->where('reg_name', 'like', "%{$query}%");
            })
            ->take(5)
            ->get();

        // Search Sellers (Targets) - by name, project code, website, or country
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
                'type' => 'Target'
            ];
        });

        // Search Buyers (Investors) - by name, project code, website, or country
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
                'type' => 'Investor'
            ];
        });

        // Search Documents (Files)
        $documents = File::where('filename', 'like', "%{$query}%")
            ->take(5)
            ->get();

        // Search Staff (Employees)
        $staff = Employee::where('first_name', 'like', "%{$query}%")
            ->orWhere('last_name', 'like', "%{$query}%")
            ->orWhere('work_email', 'like', "%{$query}%")
            ->take(5)
            ->get();

        // Search Partners
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
            ];
        });

        return response()->json([
            'deals' => $deals,
            'investors' => $mappedBuyers,
            'targets' => $mappedSellers,
            'staff' => $staff,
            'partners' => $mappedPartners,
            'documents' => $documents,
        ]);
    }
}
