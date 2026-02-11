<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Log;

class CurrencyController extends Controller
{
    /**
     * Refresh exchange rates from an external API.
     * Uses the free open.er-api.com (no API key required).
     */
    public function refreshRates(): JsonResponse
    {
        try {
            // Fetch latest USD-based rates from free API
            $response = Http::withoutVerifying()->timeout(15)->get('https://open.er-api.com/v6/latest/USD');

            if (!$response->successful()) {
                return response()->json([
                    'message' => 'Failed to fetch exchange rates from external API',
                ], 502);
            }

            $data = $response->json();
            $rates = $data['rates'] ?? [];

            if (empty($rates)) {
                return response()->json([
                    'message' => 'No rates returned from external API',
                ], 502);
            }

            // Update all registered currencies with fresh rates
            $currencies = Currency::all();
            $updatedCount = 0;

            foreach ($currencies as $currency) {
                $code = strtoupper($currency->currency_code);
                if (isset($rates[$code])) {
                    $currency->exchange_rate = $rates[$code];
                    $currency->source = 'api';
                    $currency->save();
                    $updatedCount++;
                }
            }

            return response()->json([
                'message' => "Exchange rates refreshed successfully. Updated {$updatedCount} currencies.",
                'updated' => $updatedCount,
                'api_time' => $data['time_last_update_utc'] ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Currency refresh failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to refresh exchange rates',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);

        if ($search) {
            $currencies = Currency::where('currency_name', 'like', '%' . $search . '%')
                ->orWhere('currency_code', 'like', '%' . $search . '%')
                ->orWhere('currency_sign', 'like', '%' . $search . '%')
                ->orWhere('country', 'like', '%' . $search . '%')
                ->paginate($perPage);
        } else {
            $currencies = Currency::paginate($perPage);
        }

        return response()->json([
            'data' => $currencies->items(),
            'meta' => [
                'total' => $currencies->total(),
                'current_page' => $currencies->currentPage(),
                'last_page' => $currencies->lastPage(),
                'per_page' => $currencies->perPage(),
            ]
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'currency_name' => 'required|string|max:255',
            'currency_code' => 'required|string|max:10|unique:currencies,currency_code',
            'currency_sign' => 'required|string|max:10',
            'origin_country' => 'required|numeric|exists:countries,id',
            'dollar_unit' => 'required|string',
            'exchange_rate' => 'required|numeric',
            'source' => 'nullable|string|max:255',
        ]);

        $currency = Currency::create($validated);

        return response()->json([
            'message' => 'Currency created successfully',
            'data' => $currency
        ], 201);
    }


    /**
     * Display the specified resource.
     */
    public function show(Currency $currency)
    {
        return response()->json($currency);
    }

    /**
     * Display the specified resource for editing (for API).
     */
    public function edit(Currency $currency)
    {

    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Currency $currency)
    {
        // Validate the incoming data
        $validated = $request->validate([
            'currency_name' => 'required|string|max:255',
            'currency_code' => 'required|string|max:10|unique:currencies,currency_code,' . $currency->id,
            'currency_sign' => 'required|string|max:10',
            'origin_country' => 'required|numeric|exists:countries,id',
            'dollar_unit' => 'required|string|max:255',
            'exchange_rate' => 'required|numeric',
            'source' => 'nullable|string|max:255',
        ]);

        // Update the currency record with validated data
        $currency->update([
            'currency_name' => $validated['currency_name'],
            'currency_code' => $validated['currency_code'],
            'currency_sign' => $validated['currency_sign'],
            'origin_country' => $validated['origin_country'],
            'dollar_unit' => $validated['dollar_unit'],
            'exchange_rate' => $validated['exchange_rate'],
            'source' => $validated['source'],
        ]);

        // Return a response indicating success
        return response()->json([
            'message' => 'Currency updated successfully.',
            'currency' => $currency,  // Optionally return the updated currency
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request)
    {
        try {
            $idsToDelete = $request->input('ids');

            if (empty($idsToDelete)) {
                return response()->json(['message' => 'No Currency IDs provided for deletion.'], 400);
            }

            $idsToDelete = is_array($idsToDelete) ? $idsToDelete : [$idsToDelete];

            $deletedCount = 0;

            DB::transaction(function () use ($idsToDelete, &$deletedCount) {
                $currencies = Currency::whereIn('id', $idsToDelete)->get();

                $deletedCount = $currencies->count();

                foreach ($currencies as $currency) {
                    $currency->delete();
                }
            });

            if ($deletedCount > 0) {
                $message = $deletedCount === 1
                    ? 'Currency deleted successfully.'
                    : "$deletedCount currencies deleted successfully.";

                return response()->json(['message' => $message], 200);
            }

            return response()->json(['message' => 'No currencies found with the provided IDs.'], 404);

        } catch (\Exception $e) {
            Log::error('Error deleting currencies: ' . $e->getMessage(), [
                'exception' => $e,
                'ids_provided' => $request->input('ids'),
            ]);

            return response()->json([
                'message' => 'Failed to delete currency record(s).',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
