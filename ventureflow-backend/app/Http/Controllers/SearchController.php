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
            ->get(['id', 'name', 'status']); // Select necessary fields

        // Search Sellers
        $sellers = Seller::whereHas('companyOverview', function ($q) use ($query) {
                $q->where('reg_name', 'like', "%{$query}%");
            })
            ->with(['companyOverview' => function ($q) {
                $q->select('id', 'reg_name'); // Need to check if I can select fields in relationship like this or if it needs foreign key
            }])
            ->take(5)
            ->get();
        // Post-process to flatten structure if needed, or just return as is.
        // Doing simple selection for now.
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

        // Search Documents
        $documents = File::where('filename', 'like', "%{$query}%")
            ->take(5)
            ->get(['id', 'filename', 'size', 'mime_type']);

        // Search Contacts (Employees)
        $contacts = Employee::where('first_name', 'like', "%{$query}%")
            ->orWhere('last_name', 'like', "%{$query}%")
            ->orWhere('work_email', 'like', "%{$query}%")
            ->take(5)
            ->get(['id', 'first_name', 'last_name', 'work_email', 'image']);

        return response()->json([
            'deals' => $deals,
            'companies' => $companies,
            'documents' => $documents,
            'contacts' => $contacts,
        ]);
    }
}
