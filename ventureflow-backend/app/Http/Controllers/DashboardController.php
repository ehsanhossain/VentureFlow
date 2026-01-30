<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use App\Models\Seller;
use App\Models\Buyer;
use Illuminate\Support\Arr;
use App\Models\Partner;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{

    public function getSellerBuyerData(Request $request)
    {
        $user = $request->user();
        $isPartner = $user && ($user->hasRole('partner') || $user->is_partner ?? false);

        $showSellerName = true;
        $showBuyerName = true;

        if ($isPartner) {
            $sSet = \App\Models\PartnerSetting::where('setting_key', 'seller_sharing_config')->first();
            $bSet = \App\Models\PartnerSetting::where('setting_key', 'buyer_sharing_config')->first();

            $showSellerName = $sSet && is_array($sSet->setting_value) && ($sSet->setting_value['company_overview.reg_name'] ?? false);
            $showBuyerName = $bSet && is_array($bSet->setting_value) && ($bSet->setting_value['company_overview.reg_name'] ?? false);
        }

        $sellers = Seller::with('companyOverview')
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($seller) use ($showSellerName) {
                return [
                    'id' => $seller->id,
                    'image' => $seller->image ?? null,
                    'reg_name' => $showSellerName ? ($seller->companyOverview->reg_name ?? null) : ($seller->seller_id ?? 'Restricted'),
                    'status' => $seller->companyOverview->status ?? null,
                    'type' => 1,
                    'created_at' => $seller->created_at,
                ];
            });

        $buyers = Buyer::with('companyOverview')
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($buyer) use ($showBuyerName) {
                return [
                    'id' => $buyer->id,
                    'image' => $buyer->image ?? null,
                    'reg_name' => $showBuyerName ? ($buyer->companyOverview->reg_name ?? null) : ($buyer->buyer_id ?? 'Restricted'),
                    'status' => $buyer->companyOverview->status ?? null,
                    'type' => 2, // Buyer
                    'created_at' => $buyer->created_at,
                ];
            });

        $combined = collect([])
            ->merge($sellers)
            ->merge($buyers)
            ->sortByDesc('created_at')
            ->take(20)
            ->values()
            ->map(function ($item) {
                return Arr::except($item, ['created_at']);
            });

        return response()->json($combined);
    }

    public function getCounts()
    {
        $now = Carbon::now();

        $total = [
            'sellers' => Seller::where('status', 1)->count(),
            'buyers' => Buyer::where('status', 1)->count(),
            'partners' => Partner::where('status', 1)->count(),
        ];

        $monthly = [
            'sellers' => Seller::where('status', 1)
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $now->month)
                ->count(),

            'buyers' => Buyer::where('status', 1)
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $now->month)
                ->count(),

            'partners' => Partner::where('status', 1)
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $now->month)
                ->count(),
        ];

        return response()->json([
            'total' => $total,
            'current_month' => $monthly,
        ]);
    }
}
