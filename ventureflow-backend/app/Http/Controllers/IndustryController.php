<?php

namespace App\Http\Controllers;

use App\Models\Industry;
use App\Models\SellersCompanyOverview;
use App\Models\BuyersCompanyOverview;
use App\Models\BuyersTargetPreferences;
use App\Services\IndustrySimilarityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IndustryController extends Controller
{
    /**
     * Fetch all industries with sub-industries.
     */
    public function index()
    {
        $industries = Industry::with('subIndustries')->get();
        return response()->json($industries);
    }

    /**
     * Create a new industry.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'boolean',
        ]);

        $industry = Industry::create($data);
        return response()->json($industry, 201);
    }

    /**
     * Show a single industry.
     */
    public function show(Industry $industry)
    {
        return response()->json($industry);
    }

    /**
     * Update an industry.
     */
    public function update(Request $request, Industry $industry)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'status' => 'boolean',
        ]);

        $oldName = $industry->name;
        $industry->update($data);

        // If the name changed, cascade-update all prospect JSON fields
        if (isset($data['name']) && $data['name'] !== $oldName) {
            $this->cascadeIndustryRename($industry->id, $oldName, $data['name']);
        }

        return response()->json($industry);
    }

    /**
     * Delete an industry.
     */
    public function destroy(Industry $industry)
    {
        // Check if industry is in use by any prospects
        $usageCount = $this->countIndustryUsage($industry->id);

        if ($usageCount > 0) {
            return response()->json([
                'message' => "Cannot delete: this industry is used by {$usageCount} prospect(s). Remove it from all prospects first, or deactivate it instead.",
            ], 422);
        }

        $industry->delete();
        return response()->json(['message' => 'Industry deleted successfully.']);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  NEW ENDPOINTS — Industry Management Settings
    // ═══════════════════════════════════════════════════════════════════

    /**
     * GET /api/industries/stats
     *
     * Returns all primary industries + prospect usage counts.
     * Counts how many seller/buyer overviews reference each industry ID
     * in their JSON columns.
     */
    public function stats()
    {
        $industries = Industry::orderBy('name', 'asc')->get();
        $industryIds = $industries->pluck('id')->toArray();

        // Pre-compute all usage counts in batch
        $usageCounts = $this->batchCountIndustryUsage($industryIds);

        $result = $industries->map(function ($ind) use ($usageCounts) {
            return [
                'id'           => $ind->id,
                'name'         => $ind->name,
                'status'       => $ind->status,
                'created_at'   => $ind->created_at,
                'usage_count'  => $usageCounts[$ind->id] ?? 0,
            ];
        });

        return response()->json($result->values());
    }

    /**
     * GET /api/industries/adhoc
     *
     * Scans all prospect JSON columns to find industry entries that are NOT
     * in the industries table (ad-hoc / user-created during registration).
     * Groups duplicates by name, counts usage, and provides smart merge suggestions.
     */
    public function adhoc()
    {
        $primaryIds = Industry::pluck('id')->toArray();
        $similarityService = new IndustrySimilarityService();
        $adhocMap = []; // name => ['count' => n, 'sources' => [...]]

        // Scan sellers_company_overviews.industry_ops
        $sellerOverviews = SellersCompanyOverview::whereNotNull('industry_ops')->get(['id', 'industry_ops']);
        foreach ($sellerOverviews as $overview) {
            $items = is_array($overview->industry_ops) ? $overview->industry_ops : [];
            foreach ($items as $item) {
                if (!is_array($item) || empty($item['name'])) continue;
                $id = $item['id'] ?? null;
                if ($id && !in_array($id, $primaryIds) && ($id > 1000000 || ($item['status'] ?? '') === 'new')) {
                    $name = trim($item['name']);
                    if (!isset($adhocMap[$name])) {
                        $adhocMap[$name] = ['count' => 0, 'sources' => []];
                    }
                    $adhocMap[$name]['count']++;
                    $adhocMap[$name]['sources'][] = [
                        'type' => 'seller', 'table' => 'sellers_company_overviews',
                        'column' => 'industry_ops', 'overview_id' => $overview->id,
                    ];
                }
            }
        }

        // Scan buyers_company_overviews.main_industry_operations
        $buyerOverviews = BuyersCompanyOverview::where(function ($q) {
            $q->whereNotNull('main_industry_operations')
              ->orWhereNotNull('company_industry');
        })->get(['id', 'main_industry_operations', 'company_industry']);

        foreach ($buyerOverviews as $overview) {
            // main_industry_operations
            $items = is_array($overview->main_industry_operations) ? $overview->main_industry_operations : [];
            foreach ($items as $item) {
                if (!is_array($item) || empty($item['name'])) continue;
                $id = $item['id'] ?? null;
                if ($id && !in_array($id, $primaryIds) && ($id > 1000000 || ($item['status'] ?? '') === 'new')) {
                    $name = trim($item['name']);
                    if (!isset($adhocMap[$name])) {
                        $adhocMap[$name] = ['count' => 0, 'sources' => []];
                    }
                    $adhocMap[$name]['count']++;
                    $adhocMap[$name]['sources'][] = [
                        'type' => 'buyer', 'table' => 'buyers_company_overviews',
                        'column' => 'main_industry_operations', 'overview_id' => $overview->id,
                    ];
                }
            }

            // company_industry
            $items2 = is_array($overview->company_industry) ? $overview->company_industry : [];
            foreach ($items2 as $item) {
                if (!is_array($item) || empty($item['name'])) continue;
                $id = $item['id'] ?? null;
                if ($id && !in_array($id, $primaryIds) && ($id > 1000000 || ($item['status'] ?? '') === 'new')) {
                    $name = trim($item['name']);
                    if (!isset($adhocMap[$name])) {
                        $adhocMap[$name] = ['count' => 0, 'sources' => []];
                    }
                    $adhocMap[$name]['count']++;
                    $adhocMap[$name]['sources'][] = [
                        'type' => 'buyer', 'table' => 'buyers_company_overviews',
                        'column' => 'company_industry', 'overview_id' => $overview->id,
                    ];
                }
            }
        }

        // Scan buyers_target_preferences.b_ind_prefs
        $targetPrefs = BuyersTargetPreferences::whereNotNull('b_ind_prefs')->get(['id', 'b_ind_prefs']);
        foreach ($targetPrefs as $pref) {
            $items = is_array($pref->b_ind_prefs) ? $pref->b_ind_prefs : [];
            foreach ($items as $item) {
                if (!is_array($item) || empty($item['name'])) continue;
                $id = $item['id'] ?? null;
                if ($id && !in_array($id, $primaryIds) && ($id > 1000000 || ($item['status'] ?? '') === 'new')) {
                    $name = trim($item['name']);
                    if (!isset($adhocMap[$name])) {
                        $adhocMap[$name] = ['count' => 0, 'sources' => []];
                    }
                    $adhocMap[$name]['count']++;
                    $adhocMap[$name]['sources'][] = [
                        'type' => 'buyer_pref', 'table' => 'buyers_target_preferences',
                        'column' => 'b_ind_prefs', 'pref_id' => $pref->id,
                    ];
                }
            }
        }

        // Build response with smart suggestions for each ad-hoc industry
        $adhocList = [];
        foreach ($adhocMap as $name => $info) {
            $adhocList[] = [
                'name'        => $name,
                'count'       => $info['count'],
                'suggestions' => $similarityService->suggest($name),
            ];
        }

        // Sort by count descending (most used ad-hoc first)
        usort($adhocList, fn($a, $b) => $b['count'] <=> $a['count']);

        return response()->json($adhocList);
    }

    /**
     * POST /api/industries/promote
     *
     * Promote an ad-hoc industry to a primary one:
     * 1. Create it in the industries table
     * 2. Update all prospect JSON fields that reference this ad-hoc name
     *    to use the new database ID and remove the 'new' status
     */
    public function promote(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $adhocName = trim($data['name']);

        // Check if an industry with this name already exists
        $existing = Industry::whereRaw('LOWER(name) = ?', [strtolower($adhocName)])->first();
        if ($existing) {
            // If it already exists, just merge into the existing one
            $this->replaceAdhocInProspects($adhocName, $existing->id, $existing->name);

            return response()->json([
                'message'  => "Industry \"{$adhocName}\" already exists. Merged all prospects into the existing entry.",
                'industry' => $existing,
                'action'   => 'merged',
            ]);
        }

        // Create new primary industry
        $industry = Industry::create([
            'name'   => $adhocName,
            'status' => 1,
        ]);

        // Update all prospect JSON fields
        $updated = $this->replaceAdhocInProspects($adhocName, $industry->id, $industry->name);

        return response()->json([
            'message'        => "Industry \"{$adhocName}\" promoted to primary. {$updated} prospect record(s) updated.",
            'industry'       => $industry,
            'records_updated' => $updated,
            'action'         => 'promoted',
        ]);
    }

    /**
     * POST /api/industries/merge
     *
     * Merge an ad-hoc industry into an existing primary industry:
     * Update all prospect JSON fields where the ad-hoc name appears
     * to reference the target primary industry's ID and name.
     */
    public function merge(Request $request)
    {
        $data = $request->validate([
            'adhoc_name'          => 'required|string|max:255',
            'target_industry_id'  => 'required|integer|exists:industries,id',
        ]);

        $adhocName = trim($data['adhoc_name']);
        $targetIndustry = Industry::findOrFail($data['target_industry_id']);

        $updated = $this->replaceAdhocInProspects($adhocName, $targetIndustry->id, $targetIndustry->name);

        return response()->json([
            'message'         => "Merged \"{$adhocName}\" into \"{$targetIndustry->name}\". {$updated} prospect record(s) updated.",
            'target_industry' => $targetIndustry,
            'records_updated' => $updated,
        ]);
    }

    /**
     * POST /api/industries/rename-adhoc
     *
     * Rename an ad-hoc industry across ALL prospect JSON fields.
     * This does NOT create a primary entry — it just updates the name
     * in every seller/buyer/target-preference JSON column that contains
     * the old ad-hoc name, so the change is reflected everywhere
     * (investor reg page, view page, target page, etc.).
     */
    public function renameAdhoc(Request $request)
    {
        $data = $request->validate([
            'old_name' => 'required|string|max:255',
            'new_name' => 'required|string|max:255',
        ]);

        $oldName = trim($data['old_name']);
        $newName = trim($data['new_name']);

        if (strtolower($oldName) === strtolower($newName)) {
            return response()->json(['message' => 'Names are the same, nothing to change.']);
        }

        $totalUpdated = 0;
        $oldLower = strtolower($oldName);

        $renameInColumn = function (string $modelClass, string $column) use ($oldLower, $newName, &$totalUpdated) {
            $records = $modelClass::whereNotNull($column)->get();
            foreach ($records as $record) {
                $items = is_array($record->$column) ? $record->$column : [];
                $changed = false;

                foreach ($items as &$item) {
                    if (!is_array($item) || empty($item['name'])) continue;

                    if (strtolower(trim($item['name'])) === $oldLower) {
                        $item['name'] = $newName;
                        $changed = true;
                    }
                }
                unset($item);

                if ($changed) {
                    $record->$column = $items;
                    $record->save();
                    $totalUpdated++;
                }
            }
        };

        $renameInColumn(SellersCompanyOverview::class, 'industry_ops');
        $renameInColumn(BuyersCompanyOverview::class, 'main_industry_operations');
        $renameInColumn(BuyersCompanyOverview::class, 'company_industry');
        $renameInColumn(BuyersTargetPreferences::class, 'b_ind_prefs');

        return response()->json([
            'message'         => "Renamed \"{$oldName}\" to \"{$newName}\". {$totalUpdated} prospect record(s) updated.",
            'records_updated' => $totalUpdated,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Count how many prospects reference a given industry ID in their JSON fields.
     */
    private function countIndustryUsage(int $industryId): int
    {
        $count = 0;

        // sellers_company_overviews.industry_ops
        $count += SellersCompanyOverview::whereRaw(
            'JSON_CONTAINS(JSON_EXTRACT(industry_ops, "$[*].id"), CAST(? AS JSON))',
            [$industryId]
        )->count();

        // buyers_company_overviews.main_industry_operations
        $count += BuyersCompanyOverview::whereRaw(
            'JSON_CONTAINS(JSON_EXTRACT(main_industry_operations, "$[*].id"), CAST(? AS JSON))',
            [$industryId]
        )->count();

        // buyers_company_overviews.company_industry
        $count += BuyersCompanyOverview::whereRaw(
            'JSON_CONTAINS(JSON_EXTRACT(company_industry, "$[*].id"), CAST(? AS JSON))',
            [$industryId]
        )->count();

        // buyers_target_preferences.b_ind_prefs
        $count += BuyersTargetPreferences::whereRaw(
            'JSON_CONTAINS(JSON_EXTRACT(b_ind_prefs, "$[*].id"), CAST(? AS JSON))',
            [$industryId]
        )->count();

        return $count;
    }

    /**
     * Batch-count usage for multiple industry IDs in a single pass.
     * Returns [ industryId => count, ... ]
     */
    private function batchCountIndustryUsage(array $industryIds): array
    {
        $counts = array_fill_keys($industryIds, 0);

        // Helper: scan all records once, count each industry ID
        $scanJsonColumn = function (string $model, string $column) use (&$counts, $industryIds) {
            $records = $model::whereNotNull($column)->get([$column]);
            foreach ($records as $record) {
                $items = is_array($record->$column) ? $record->$column : [];
                foreach ($items as $item) {
                    if (is_array($item) && isset($item['id']) && in_array($item['id'], $industryIds)) {
                        $counts[$item['id']]++;
                    }
                }
            }
        };

        $scanJsonColumn(SellersCompanyOverview::class, 'industry_ops');
        $scanJsonColumn(BuyersCompanyOverview::class, 'main_industry_operations');
        $scanJsonColumn(BuyersCompanyOverview::class, 'company_industry');
        $scanJsonColumn(BuyersTargetPreferences::class, 'b_ind_prefs');

        return $counts;
    }

    /**
     * Replace an ad-hoc industry (by name, case-insensitive) across all prospect
     * JSON columns with the given primary industry ID and name.
     *
     * Returns the total number of records updated.
     */
    private function replaceAdhocInProspects(string $adhocName, int $newId, string $newName): int
    {
        $totalUpdated = 0;
        $adhocLower = strtolower(trim($adhocName));

        // Helper to replace in a specific model/column
        $replaceInColumn = function (string $modelClass, string $column) use ($adhocLower, $newId, $newName, &$totalUpdated) {
            $records = $modelClass::whereNotNull($column)->get();
            foreach ($records as $record) {
                $items = is_array($record->$column) ? $record->$column : [];
                $changed = false;

                foreach ($items as &$item) {
                    if (!is_array($item) || empty($item['name'])) continue;

                    if (strtolower(trim($item['name'])) === $adhocLower) {
                        // Check if this entry is ad-hoc (Date.now ID or 'new' status)
                        $isAdhoc = (($item['id'] ?? 0) > 1000000) || (($item['status'] ?? '') === 'new');
                        // Also replace if the ID doesn't match a known primary
                        $isOrphan = !in_array($item['id'] ?? 0, Industry::pluck('id')->toArray());

                        if ($isAdhoc || $isOrphan) {
                            $item['id']   = $newId;
                            $item['name'] = $newName;
                            unset($item['status']); // Remove 'new' status
                            $changed = true;
                        }
                    }
                }
                unset($item);

                if ($changed) {
                    // Remove duplicates that may arise from merging
                    $seen = [];
                    $deduped = [];
                    foreach ($items as $it) {
                        $key = ($it['id'] ?? '') . '::' . ($it['name'] ?? '');
                        if (!isset($seen[$key])) {
                            $seen[$key] = true;
                            $deduped[] = $it;
                        }
                    }

                    $record->$column = $deduped;
                    $record->save();
                    $totalUpdated++;
                }
            }
        };

        $replaceInColumn(SellersCompanyOverview::class, 'industry_ops');
        $replaceInColumn(BuyersCompanyOverview::class, 'main_industry_operations');
        $replaceInColumn(BuyersCompanyOverview::class, 'company_industry');
        $replaceInColumn(BuyersTargetPreferences::class, 'b_ind_prefs');

        return $totalUpdated;
    }

    /**
     * When a primary industry is renamed, cascade the name change to all prospect
     * JSON fields that reference this industry by ID.
     */
    private function cascadeIndustryRename(int $industryId, string $oldName, string $newName): void
    {
        $updateNameInColumn = function (string $modelClass, string $column) use ($industryId, $newName) {
            $records = $modelClass::whereNotNull($column)->get();
            foreach ($records as $record) {
                $items = is_array($record->$column) ? $record->$column : [];
                $changed = false;

                foreach ($items as &$item) {
                    if (is_array($item) && isset($item['id']) && (int)$item['id'] === $industryId) {
                        $item['name'] = $newName;
                        $changed = true;
                    }
                }
                unset($item);

                if ($changed) {
                    $record->$column = $items;
                    $record->save();
                }
            }
        };

        $updateNameInColumn(SellersCompanyOverview::class, 'industry_ops');
        $updateNameInColumn(BuyersCompanyOverview::class, 'main_industry_operations');
        $updateNameInColumn(BuyersCompanyOverview::class, 'company_industry');
        $updateNameInColumn(BuyersTargetPreferences::class, 'b_ind_prefs');
    }
}
