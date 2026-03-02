<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PartnerDataController extends Controller
{
    /**
     * Get parsed allowed fields from partner sharing settings
     * Returns only explicitly enabled fields, NO fallbacks to all data
     */
    private function getParsedAllowedFields($type)
    {
        $setting = \App\Models\PartnerSetting::where('setting_key', $type . '_sharing_config')->first();
        
        $parsed = [
            'root' => ['id'], // Always include base ID
            'relationships' => []
        ];

        // If no settings exist, return minimal data
        if (!$setting || !is_array($setting->setting_value)) {
            Log::info("No partner sharing settings for type: {$type}");
            return $parsed;
        }

        // Get only explicitly enabled (true) fields
        $enabledFields = array_keys(array_filter($setting->setting_value, function($val) {
            return $val === true;
        }));

        Log::info("Partner sharing enabled fields for {$type}: " . json_encode($enabledFields));

        foreach ($enabledFields as $field) {
            if (str_contains($field, '.')) {
                // Nested field (e.g., company_overview.hq_country)
                $parts = explode('.', $field);
                $relation = \Illuminate\Support\Str::camel($parts[0]); // Convert to camelCase
                $attribute = $parts[1];

                if (!isset($parsed['relationships'][$relation])) {
                    $parsed['relationships'][$relation] = ['id'];
                }
                
                $parsed['relationships'][$relation][] = $attribute;
            } else {
                // Root field (e.g., buyer_id, seller_id)
                $parsed['root'][] = $field;
            }
        }

        return $parsed;
    }

    public function getDashboardStats()
    {
        try {
            // Count shared buyers and sellers
            return response()->json([
                'shared_investors' => \App\Models\Buyer::count(),
                'shared_targets' => \App\Models\Seller::count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Partner Dashboard Stats Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch stats'], 500);
        }
    }

    public function getSharedBuyers(Request $request)
    {
        try {
            $fields = $this->getParsedAllowedFields('buyer');

            // Build base query with only allowed root fields
            $selectFields = array_unique($fields['root']);
            
            // Add foreign keys needed for relationships
            if (!empty($fields['relationships']['companyOverview'])) {
                $selectFields[] = 'company_overview_id';
            }
            if (!empty($fields['relationships']['financialDetails'])) {
                $selectFields[] = 'financial_detail_id';
            }
            if (!empty($fields['relationships']['targetPreferences'])) {
                $selectFields[] = 'target_preference_id';
            }

            $query = \App\Models\Buyer::select(array_unique($selectFields));

            // Load only allowed relationship fields
            foreach ($fields['relationships'] as $relation => $attributes) {
                $attributes = array_unique($attributes);
                $query->with([$relation => function($q) use ($attributes) {
                    $q->select($attributes);
                    
                    // If hq_country is selected, also load the country relationship
                    if (in_array('hq_country', $attributes)) {
                        $q->with('hqCountry:id,name,alpha_2_code');
                    }
                }]);
            }

            // Search functionality
            if ($request->has('search') && $request->input('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('buyer_id', 'like', "%{$search}%")
                      ->orWhereHas('companyOverview', function($sub) use ($search) {
                          $sub->where('reg_name', 'like', "%{$search}%"); 
                      });
                });
            }

            return response()->json($query->paginate(15));
        } catch (\Exception $e) {
            Log::error('Shared Buyers Error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch investors: ' . $e->getMessage()], 500);
        }
    }

    public function getSharedSellers(Request $request)
    {
        try {
            $fields = $this->getParsedAllowedFields('seller');
            
            // Build base query with only allowed root fields
            $selectFields = array_unique($fields['root']);
            
            // Add foreign keys needed for relationships
            if (!empty($fields['relationships']['companyOverview'])) {
                $selectFields[] = 'company_overview_id';
            }
            if (!empty($fields['relationships']['financialDetails'])) {
                $selectFields[] = 'financial_detail_id';
            }

            $query = \App\Models\Seller::select(array_unique($selectFields));

            // Load only allowed relationship fields  
            foreach ($fields['relationships'] as $relation => $attributes) {
                $attributes = array_unique($attributes);
                $query->with([$relation => function($q) use ($attributes) {
                    $q->select($attributes);

                    if (in_array('hq_country', $attributes)) {
                        $q->with('hqCountry:id,name,alpha_2_code');
                    }
                }]);
            }

            // Search functionality
            if ($request->has('search') && $request->input('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('seller_id', 'like', "%{$search}%")
                      ->orWhereHas('companyOverview', function($sub) use ($search) {
                          $sub->where('reg_name', 'like', "%{$search}%");
                      });
                });
            }

            return response()->json($query->paginate(15));
        } catch (\Exception $e) {
            Log::error('Shared Sellers Error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch targets: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get the currently-logged-in partner's profile
     */
    public function getMyProfile(Request $request)
    {
        try {
            $user = $request->user();
            $partner = \App\Models\Partner::where('user_id', $user->id)->first();

            if (!$partner) {
                return response()->json(['error' => 'Partner profile not found'], 404);
            }

            return response()->json([
                'data' => $partner,
            ]);
        } catch (\Exception $e) {
            Log::error('getMyProfile Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch profile'], 500);
        }
    }

    /**
     * Update the currently-logged-in partner's profile
     */
    public function updateMyProfile(Request $request)
    {
        try {
            $user = $request->user();
            $partner = \App\Models\Partner::where('user_id', $user->id)->first();

            if (!$partner) {
                return response()->json(['error' => 'Partner profile not found'], 404);
            }

            $partner->update($request->only([
                'company_name',
                'company_address',
                'contact_person',
                'contact_email',
                'contact_phone',
            ]));

            return response()->json([
                'data' => $partner->fresh(),
                'message' => 'Profile updated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('updateMyProfile Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update profile'], 500);
        }
    }
}
