<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Deal;
use App\Models\Seller;
use App\Models\Buyer;
use App\Models\File;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->query('query');

        if (!$query) {
            return response()->json([
                'deals' => [],
                'companies' => [],
                'documents' => [],
                'contacts' => [],
            ]);
        }

        // Search Deals
        $deals = Deal::where('name', 'like', "%{$query}%")
            ->take(5)
            ->get();

        // Search Sellers
        $sellers = Seller::whereHas('companyOverview', function ($q) use ($query) {
                $q->where('reg_name', 'like', "%{$query}%");
            })
            ->with('companyOverview')
            ->take(5)
            ->get();

        $mappedSellers = $sellers->map(function ($seller) {
            return [
                'id' => $seller->id,
                'name' => $seller->companyOverview->reg_name ?? 'Unknown Seller',
                'type' => 'Seller'
            ];
        });

        // Search Buyers
        $buyers = Buyer::whereHas('companyOverview', function ($q) use ($query) {
                $q->where('reg_name', 'like', "%{$query}%");
            })
            ->with('companyOverview')
            ->take(5)
            ->get();
        $mappedBuyers = $buyers->map(function ($buyer) {
            return [
                'id' => $buyer->id,
                'name' => $buyer->companyOverview->reg_name ?? 'Unknown Buyer',
                'type' => 'Buyer'
            ];
        });

        $companies = $mappedSellers->merge($mappedBuyers);

        // Search Documents (Files)
        $documents = File::where('filename', 'like', "%{$query}%")
            ->take(5)
            ->get();

        // Search Contacts (Employees)
        $contacts = Employee::where('first_name', 'like', "%{$query}%")
            ->orWhere('last_name', 'like', "%{$query}%")
            ->orWhere('work_email', 'like', "%{$query}%")
            ->take(5)
            ->get();

        return response()->json([
            'deals' => $deals,
            'companies' => $companies,
            'documents' => $documents,
            'contacts' => $contacts,
        ]);
    }
}
