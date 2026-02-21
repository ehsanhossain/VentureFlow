<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Services;

use App\Models\Investor;
use App\Models\Target;
use App\Models\Match as MatchModel;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * MatchIQ — Smart Matching Engine
 *
 * Scores every Investor ↔ Target pair across 6 weighted dimensions:
 *   1. Industry    (25%) — industry preference overlap
 *   2. Geography   (20%) — target country alignment
 *   3. Financial   (20%) — budget / revenue / EBITDA fit
 *   4. Profile     (15%) — employee count, years in business, company type
 *   5. Timeline    (10%) — transaction timeline alignment
 *   6. Ownership   (10%) — shareholding / ownership preference compatibility
 *
 * Each dimension scorer returns 0.0–1.0.
 * Weighted combination produces a final score 0–100.
 */
class MatchEngineService
{
    // ─── Configurable Weights (must sum to 1.0) ─────────────────────────

    private const WEIGHTS = [
        'industry'  => 0.25,
        'geography' => 0.20,
        'financial' => 0.20,
        'profile'   => 0.15,
        'timeline'  => 0.10,
        'ownership' => 0.10,
    ];

    // Minimum total score to persist a match (below this is noise)
    private const MIN_SCORE = 30;

    private IndustrySimilarityService $industrySimilarity;

    public function __construct(IndustrySimilarityService $industrySimilarity)
    {
        $this->industrySimilarity = $industrySimilarity;
    }

    // ─── Public API ─────────────────────────────────────────────────────

    /**
     * Compute matches for a specific buyer against all active sellers.
     * Returns the collection of upserted Match models.
     */
    public function computeMatchesForBuyer(Buyer $buyer): Collection
    {
        $buyer->load(['companyOverview', 'targetPreference', 'financialDetails']);

        $sellers = Target::where('status', 1)
            ->with(['companyOverview', 'financialDetails'])
            ->get();

        $results = collect();

        foreach ($sellers as $seller) {
            try {
                $scores = $this->scoreMatch($buyer, $seller);

                if ($scores['total_score'] >= self::MIN_SCORE) {
                    $match = MatchModel::updateOrCreate(
                        ['buyer_id' => $buyer->id, 'seller_id' => $seller->id],
                        array_merge($scores, [
                            'computed_at' => now(),
                            // Don't overwrite status if already reviewed/dismissed
                        ])
                    );

                    // Only reset status if it was previously a low-score record
                    if ($match->wasRecentlyCreated) {
                        $match->update(['status' => 'pending']);
                    }

                    $results->push($match);
                }
            } catch (\Throwable $e) {
                Log::warning("MatchIQ: Failed scoring Buyer#{$buyer->id} vs Seller#{$seller->id}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Compute matches for a specific seller against all active buyers.
     */
    public function computeMatchesForSeller(Seller $seller): Collection
    {
        $seller->load(['companyOverview', 'financialDetails']);

        $buyers = Investor::where('status', 1)
            ->with(['companyOverview', 'targetPreference', 'financialDetails'])
            ->get();

        $results = collect();

        foreach ($buyers as $buyer) {
            try {
                $scores = $this->scoreMatch($buyer, $seller);

                if ($scores['total_score'] >= self::MIN_SCORE) {
                    $match = MatchModel::updateOrCreate(
                        ['buyer_id' => $buyer->id, 'seller_id' => $seller->id],
                        array_merge($scores, ['computed_at' => now()])
                    );

                    if ($match->wasRecentlyCreated) {
                        $match->update(['status' => 'pending']);
                    }

                    $results->push($match);
                }
            } catch (\Throwable $e) {
                Log::warning("MatchIQ: Failed scoring Buyer#{$buyer->id} vs Seller#{$seller->id}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Full rescan: score every buyer × seller pair.
     */
    public function fullRescan(): int
    {
        $buyers = Investor::where('status', 1)
            ->with(['companyOverview', 'targetPreference', 'financialDetails'])
            ->get();

        $sellers = Target::where('status', 1)
            ->with(['companyOverview', 'financialDetails'])
            ->get();

        $count = 0;

        foreach ($buyers as $buyer) {
            foreach ($sellers as $seller) {
                try {
                    $scores = $this->scoreMatch($buyer, $seller);

                    if ($scores['total_score'] >= self::MIN_SCORE) {
                        MatchModel::updateOrCreate(
                            ['buyer_id' => $buyer->id, 'seller_id' => $seller->id],
                            array_merge($scores, ['computed_at' => now()])
                        );
                        $count++;
                    }
                } catch (\Throwable $e) {
                    Log::warning("MatchIQ Rescan: Failed Buyer#{$buyer->id} vs Seller#{$seller->id}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        return $count;
    }

    /**
     * Score a single buyer-seller pair. Returns all dimension scores + total.
     */
    public function scoreMatch(Buyer $buyer, Seller $seller): array
    {
        $industry  = $this->scoreIndustry($buyer, $seller);
        $geography = $this->scoreGeography($buyer, $seller);
        $financial = $this->scoreFinancial($buyer, $seller);
        $profile   = $this->scoreProfile($buyer, $seller);
        $timeline  = $this->scoreTimeline($buyer, $seller);
        $ownership = $this->scoreOwnership($buyer, $seller);

        $totalScore = (int) round(
            ($industry  * self::WEIGHTS['industry'] +
             $geography * self::WEIGHTS['geography'] +
             $financial * self::WEIGHTS['financial'] +
             $profile   * self::WEIGHTS['profile'] +
             $timeline  * self::WEIGHTS['timeline'] +
             $ownership * self::WEIGHTS['ownership']) * 100
        );

        return [
            'total_score'      => min(100, max(0, $totalScore)),
            'industry_score'   => round($industry, 4),
            'geography_score'  => round($geography, 4),
            'financial_score'  => round($financial, 4),
            'profile_score'    => round($profile, 4),
            'timeline_score'   => round($timeline, 4),
            'ownership_score'  => round($ownership, 4),
        ];
    }

    // ─── Dimension Scorers ──────────────────────────────────────────────

    /**
     * DIMENSION 1: Industry Match (0.0–1.0)
     *
     * Compares buyer's preferred industries against seller's actual industries.
     * Uses IndustrySimilarityService for fuzzy matching of ad-hoc industry names.
     */
    private function scoreIndustry(Buyer $buyer, Seller $seller): float
    {
        // Buyer's preferred industries (from TargetPreferences + CompanyOverview)
        $buyerIndustries = $this->extractBuyerIndustries($buyer);
        if (empty($buyerIndustries)) return 0.5; // No preference = neutral

        // Seller's actual industries (from CompanyOverview)
        $sellerIndustries = $this->extractSellerIndustries($seller);
        if (empty($sellerIndustries)) return 0.3; // No data = low

        // Normalize all for comparison
        $buyerNorm  = array_map(fn($s) => mb_strtolower(trim($s)), $buyerIndustries);
        $sellerNorm = array_map(fn($s) => mb_strtolower(trim($s)), $sellerIndustries);

        // 1. Exact overlap (Jaccard)
        $intersection = count(array_intersect($buyerNorm, $sellerNorm));
        $union = count(array_unique(array_merge($buyerNorm, $sellerNorm)));
        $exactScore = $union > 0 ? $intersection / $union : 0.0;

        if ($exactScore > 0) {
            return min(1.0, $exactScore + 0.2); // Boost exact matches
        }

        // 2. Fuzzy matching via IndustrySimilarityService
        $bestFuzzyScore = 0.0;
        foreach ($sellerNorm as $sellerInd) {
            foreach ($buyerNorm as $buyerInd) {
                $suggestions = $this->industrySimilarity->suggest($sellerInd);
                foreach ($suggestions as $sug) {
                    if (mb_strtolower($sug['name']) === $buyerInd) {
                        $bestFuzzyScore = max($bestFuzzyScore, $sug['score'] / 100);
                    }
                }

                // Also try direct text similarity
                $textSim = $this->textSimilarity($buyerInd, $sellerInd);
                $bestFuzzyScore = max($bestFuzzyScore, $textSim);
            }
        }

        return $bestFuzzyScore;
    }

    /**
     * DIMENSION 2: Geography Match (0.0–1.0)
     *
     * Checks if seller's HQ country or operating countries overlap
     * with buyer's target countries.
     */
    private function scoreGeography(Buyer $buyer, Seller $seller): float
    {
        // Buyer's target countries
        $buyerCountries = $this->extractBuyerCountries($buyer);
        if (empty($buyerCountries)) return 0.5; // No preference = neutral

        // Seller's countries
        $sellerHq = $seller->companyOverview?->hq_country;
        $sellerOpCountries = $this->toArray($seller->companyOverview?->op_countries);

        $sellerCountries = array_filter(array_unique(
            array_merge([$sellerHq], $sellerOpCountries)
        ));

        if (empty($sellerCountries)) return 0.3; // No data = low

        // Normalize to strings for comparison
        $buyerNorm  = array_map('strval', $buyerCountries);
        $sellerNorm = array_map('strval', $sellerCountries);

        // Direct country ID/name overlap
        $intersection = count(array_intersect($buyerNorm, $sellerNorm));

        if ($intersection > 0) {
            // HQ match is worth more than operating country match
            $hqMatch = in_array(strval($sellerHq), $buyerNorm);
            return $hqMatch ? 1.0 : 0.8;
        }

        return 0.0;
    }

    /**
     * DIMENSION 3: Financial Fit (0.0–1.0)
     *
     * Checks budget alignment between buyer's investment capacity
     * and seller's expected investment amount.
     */
    private function scoreFinancial(Buyer $buyer, Seller $seller): float
    {
        $scores = [];

        // Sub-check A: Investment Budget vs Expected Investment Amount
        $budgetScore = $this->scoreBudgetFit($buyer, $seller);
        if ($budgetScore !== null) $scores[] = $budgetScore;

        // Sub-check B: EBITDA alignment
        $ebitdaScore = $this->scoreEbitdaFit($buyer, $seller);
        if ($ebitdaScore !== null) $scores[] = $ebitdaScore;

        // Sub-check C: Revenue check
        $revenueScore = $this->scoreRevenueFit($buyer, $seller);
        if ($revenueScore !== null) $scores[] = $revenueScore;

        if (empty($scores)) return 0.5; // No financial data = neutral

        return array_sum($scores) / count($scores);
    }

    /**
     * DIMENSION 4: Company Profile (0.0–1.0)
     *
     * Matches employee count range, years in business, and company type.
     */
    private function scoreProfile(Buyer $buyer, Seller $seller): float
    {
        $scores = [];

        // Sub-check A: Employee count
        $empScore = $this->scoreEmployeeCount($buyer, $seller);
        if ($empScore !== null) $scores[] = $empScore;

        // Sub-check B: Years in business
        $yearsScore = $this->scoreYearsInBusiness($buyer, $seller);
        if ($yearsScore !== null) $scores[] = $yearsScore;

        // Sub-check C: Company type
        $typeScore = $this->scoreCompanyType($buyer, $seller);
        if ($typeScore !== null) $scores[] = $typeScore;

        if (empty($scores)) return 0.5; // No profile data = neutral

        return array_sum($scores) / count($scores);
    }

    /**
     * DIMENSION 5: Timeline Alignment (0.0–1.0)
     *
     * Compares transaction timeline preferences.
     */
    private function scoreTimeline(Buyer $buyer, Seller $seller): float
    {
        $buyerTimeline = $buyer->targetPreference?->timeline
            ?? $buyer->companyOverview?->txn_timeline;
        $sellerTimeline = $seller->companyOverview?->txn_timeline;

        if (empty($buyerTimeline) || empty($sellerTimeline)) return 0.5; // No data = neutral

        $buyerNorm = mb_strtolower(trim($buyerTimeline));
        $sellerNorm = mb_strtolower(trim($sellerTimeline));

        // Exact match
        if ($buyerNorm === $sellerNorm) return 1.0;

        // Map to numeric levels for proximity comparison
        $levels = [
            'immediate' => 1, 'asap' => 1, '0-3 months' => 1, 'urgent' => 1,
            'short' => 2, 'short-term' => 2, '3-6 months' => 2, 'short term' => 2,
            'medium' => 3, 'medium-term' => 3, '6-12 months' => 3, 'medium term' => 3,
            'long' => 4, 'long-term' => 4, '12+ months' => 4, 'long term' => 4, '1-2 years' => 4,
            'flexible' => 0, 'negotiable' => 0, 'open' => 0,
        ];

        $buyerLevel = $levels[$buyerNorm] ?? null;
        $sellerLevel = $levels[$sellerNorm] ?? null;

        // Flexible buyer or seller = good compatibility
        if ($buyerLevel === 0 || $sellerLevel === 0) return 0.8;

        if ($buyerLevel !== null && $sellerLevel !== null) {
            $diff = abs($buyerLevel - $sellerLevel);
            return match ($diff) {
                0 => 1.0,
                1 => 0.7,
                2 => 0.4,
                default => 0.2,
            };
        }

        // Fallback: text similarity
        return $this->textSimilarity($buyerNorm, $sellerNorm);
    }

    /**
     * DIMENSION 6: Ownership Structure Compatibility (0.0–1.0)
     *
     * Checks if buyer's ownership preference (minority/majority)
     * is compatible with seller's maximum shareholding percentage.
     */
    private function scoreOwnership(Buyer $buyer, Seller $seller): float
    {
        $fd = $buyer->financialDetails;
        $sfd = $seller->financialDetails;

        if (!$fd && !$sfd) return 0.5; // No data = neutral

        // Buyer preferences
        $wantsMinority = $fd?->is_minority ?? false;
        $wantsMajority = $fd?->is_majority ?? false;
        $isNegotiable  = $fd?->is_negotiable ?? false;
        $ownershipType = mb_strtolower(trim($fd?->ownership_type ?? ''));
        $acquirePct    = $this->toArray($fd?->acquire_pct);

        // Seller constraints
        $maxShareholding = $sfd?->maximum_investor_shareholding_percentage;
        $investCondition = mb_strtolower(trim($sfd?->investment_condition ?? ''));

        // If buyer is negotiable, high compatibility
        if ($isNegotiable) return 0.85;

        // If no seller data, can't score
        if ($maxShareholding === null && empty($investCondition)) return 0.5;

        $maxPct = (float) ($maxShareholding ?? 100);

        // Majority buyer + seller allows >50%
        if ($wantsMajority && $maxPct >= 50) return 1.0;
        if ($wantsMajority && $maxPct < 50) return 0.3;

        // Minority buyer + seller allows some %
        if ($wantsMinority && $maxPct > 0) return 1.0;
        if ($wantsMinority && $maxPct === 0.0) return 0.1;

        // Check acquire_pct range compatibility
        if (!empty($acquirePct)) {
            $minAcquire = (float) ($acquirePct['min'] ?? $acquirePct[0] ?? 0);
            $maxAcquire = (float) ($acquirePct['max'] ?? $acquirePct[1] ?? 100);
            if ($maxPct >= $minAcquire && $maxPct <= $maxAcquire) return 1.0;
            if ($maxPct >= $minAcquire) return 0.7;
            return 0.3;
        }

        // Ownership type text matching
        if (!empty($ownershipType) && !empty($investCondition)) {
            return $this->textSimilarity($ownershipType, $investCondition);
        }

        return 0.5;
    }

    // ─── Sub-Scorers (Financial) ────────────────────────────────────────

    private function scoreBudgetFit(Buyer $buyer, Seller $seller): ?float
    {
        // Buyer's investment budget (from FinancialDetails or CompanyOverview)
        $buyerBudget = $this->toArray($buyer->financialDetails?->investment_budget)
            ?? $this->toArray($buyer->companyOverview?->investment_budget);
        $sellerAmount = $this->toArray($seller->financialDetails?->expected_investment_amount);

        if (empty($buyerBudget) && empty($sellerAmount)) return null;
        if (empty($buyerBudget) || empty($sellerAmount)) return 0.4;

        // Extract min/max from budget arrays
        $budgetMin = (float) ($buyerBudget['min'] ?? $buyerBudget[0] ?? 0);
        $budgetMax = (float) ($buyerBudget['max'] ?? $buyerBudget[1] ?? PHP_FLOAT_MAX);
        $sellerMin = (float) ($sellerAmount['min'] ?? $sellerAmount[0] ?? 0);
        $sellerMax = (float) ($sellerAmount['max'] ?? $sellerAmount[1] ?? $sellerMin);

        // Check overlap
        if ($sellerMin >= $budgetMin && $sellerMax <= $budgetMax) return 1.0; // Perfect fit
        if ($sellerMin <= $budgetMax && $sellerMax >= $budgetMin) return 0.7; // Partial overlap
        
        // Proximity score for near-misses
        $gap = min(abs($sellerMin - $budgetMax), abs($sellerMax - $budgetMin));
        $range = max($budgetMax - $budgetMin, 1);
        $proximity = max(0, 1 - ($gap / $range));
        return $proximity * 0.5;
    }

    private function scoreEbitdaFit(Buyer $buyer, Seller $seller): ?float
    {
        $buyerEbitda = $this->toArray($buyer->financialDetails?->expected_ebitda);
        $sellerEbitda = $this->toArray($seller->financialDetails?->ebitda_value);

        if (empty($buyerEbitda) && empty($sellerEbitda)) return null;
        if (empty($buyerEbitda) || empty($sellerEbitda)) return 0.4;

        $expectedMin = (float) ($buyerEbitda['min'] ?? $buyerEbitda[0] ?? 0);
        $expectedMax = (float) ($buyerEbitda['max'] ?? $buyerEbitda[1] ?? PHP_FLOAT_MAX);
        $actualMin = (float) ($sellerEbitda['min'] ?? $sellerEbitda[0] ?? 0);
        $actualMax = (float) ($sellerEbitda['max'] ?? $sellerEbitda[1] ?? $actualMin);

        if ($actualMin >= $expectedMin && $actualMax <= $expectedMax) return 1.0;
        if ($actualMin <= $expectedMax && $actualMax >= $expectedMin) return 0.7;
        return 0.2;
    }

    private function scoreRevenueFit(Buyer $buyer, Seller $seller): ?float
    {
        $buyerRevenue = $this->toArray($buyer->financialDetails?->ttm_revenue);
        $sellerRevenue = $seller->financialDetails?->annual_revenue;

        if (empty($buyerRevenue) && !$sellerRevenue) return null;
        if (empty($buyerRevenue) || !$sellerRevenue) return 0.4;

        $expectedMin = (float) ($buyerRevenue['min'] ?? $buyerRevenue[0] ?? 0);
        $expectedMax = (float) ($buyerRevenue['max'] ?? $buyerRevenue[1] ?? PHP_FLOAT_MAX);
        $actual = (float) $sellerRevenue;

        if ($actual >= $expectedMin && $actual <= $expectedMax) return 1.0;
        if ($actual >= $expectedMin * 0.7 && $actual <= $expectedMax * 1.3) return 0.7; // ±30% tolerance
        return 0.3;
    }

    // ─── Sub-Scorers (Profile) ──────────────────────────────────────────

    private function scoreEmployeeCount(Buyer $buyer, Seller $seller): ?float
    {
        $buyerRange = $buyer->targetPreference?->emp_count_range;
        $sellerCount = $seller->companyOverview?->emp_total;

        if (empty($buyerRange) && empty($sellerCount)) return null;
        if (empty($buyerRange) || empty($sellerCount)) return 0.4;

        // Try to parse range like "50-200" or "100+"
        $range = $this->parseRange($buyerRange);
        $count = (int) $sellerCount;

        if ($range) {
            if ($count >= $range['min'] && $count <= $range['max']) return 1.0;
            if ($count >= $range['min'] * 0.5 && $count <= $range['max'] * 2) return 0.6;
            return 0.2;
        }

        return 0.5;
    }

    private function scoreYearsInBusiness(Buyer $buyer, Seller $seller): ?float
    {
        $buyerPref = $buyer->targetPreference?->years_in_biz;
        $yearFounded = $seller->companyOverview?->year_founded;

        if (empty($buyerPref) && empty($yearFounded)) return null;
        if (empty($buyerPref) || empty($yearFounded)) return 0.4;

        $sellerAge = (int) date('Y') - (int) $yearFounded;

        // Parse preference range like "5-10" or "10+"
        $range = $this->parseRange($buyerPref);
        if ($range) {
            if ($sellerAge >= $range['min'] && $sellerAge <= $range['max']) return 1.0;
            if ($sellerAge >= $range['min'] * 0.5) return 0.6;
            return 0.3;
        }

        return 0.5;
    }

    private function scoreCompanyType(Buyer $buyer, Seller $seller): ?float
    {
        $buyerType = mb_strtolower(trim($buyer->targetPreference?->company_type ?? ''));
        $sellerType = mb_strtolower(trim($seller->companyOverview?->company_type ?? ''));

        if (empty($buyerType) && empty($sellerType)) return null;
        if (empty($buyerType) || empty($sellerType)) return 0.4;

        if ($buyerType === $sellerType) return 1.0;

        // Partial matching for similar types
        return $this->textSimilarity($buyerType, $sellerType);
    }

    // ─── Data Extraction Helpers ────────────────────────────────────────

    private function extractBuyerIndustries(Buyer $buyer): array
    {
        $industries = [];

        // From TargetPreferences
        $bIndPrefs = $this->toArray($buyer->targetPreference?->b_ind_prefs);
        if (!empty($bIndPrefs)) {
            foreach ($bIndPrefs as $item) {
                if (is_array($item) && isset($item['name'])) {
                    $industries[] = $item['name'];
                } elseif (is_string($item)) {
                    $industries[] = $item;
                }
            }
        }

        // From CompanyOverview company_industry
        $compInd = $this->toArray($buyer->companyOverview?->company_industry);
        if (!empty($compInd)) {
            foreach ($compInd as $item) {
                if (is_array($item) && isset($item['name'])) {
                    $industries[] = $item['name'];
                } elseif (is_string($item)) {
                    $industries[] = $item;
                }
            }
        }

        return array_values(array_unique(array_filter($industries)));
    }

    private function extractSellerIndustries(Seller $seller): array
    {
        $industries = [];

        $ops = $this->toArray($seller->companyOverview?->industry_ops);
        if (!empty($ops)) {
            foreach ($ops as $item) {
                if (is_array($item) && isset($item['name'])) {
                    $industries[] = $item['name'];
                } elseif (is_string($item)) {
                    $industries[] = $item;
                }
            }
        }

        $niche = $this->toArray($seller->companyOverview?->niche_industry);
        if (!empty($niche)) {
            foreach ($niche as $item) {
                if (is_array($item) && isset($item['name'])) {
                    $industries[] = $item['name'];
                } elseif (is_string($item)) {
                    $industries[] = $item;
                }
            }
        }

        return array_values(array_unique(array_filter($industries)));
    }

    private function extractBuyerCountries(Buyer $buyer): array
    {
        $countries = [];

        $tpCountries = $this->toArray($buyer->targetPreference?->target_countries);
        $coCountries = $this->toArray($buyer->companyOverview?->target_countries);

        foreach ([$tpCountries, $coCountries] as $list) {
            if (!empty($list)) {
                foreach ($list as $item) {
                    if (is_array($item) && isset($item['id'])) {
                        $countries[] = strval($item['id']);
                    } elseif (is_array($item) && isset($item['country_id'])) {
                        $countries[] = strval($item['country_id']);
                    } elseif (is_numeric($item)) {
                        $countries[] = strval($item);
                    } elseif (is_string($item)) {
                        $countries[] = $item;
                    }
                }
            }
        }

        return array_values(array_unique(array_filter($countries)));
    }

    // ─── Utility Helpers ────────────────────────────────────────────────

    /**
     * Safely cast a value to array (handles JSON strings, arrays, null).
     */
    private function toArray(mixed $value): array
    {
        if (is_array($value)) return $value;
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) return $decoded;
            return [$value];
        }
        if ($value === null) return [];
        return [$value];
    }

    /**
     * Parse a range string like "50-200", "100+", "5+" into min/max.
     */
    private function parseRange(mixed $value): ?array
    {
        if (is_array($value)) {
            return [
                'min' => (int) ($value['min'] ?? $value[0] ?? 0),
                'max' => (int) ($value['max'] ?? $value[1] ?? PHP_INT_MAX),
            ];
        }

        if (!is_string($value)) return null;

        $value = trim($value);

        // "100+" pattern
        if (preg_match('/^(\d+)\+$/', $value, $m)) {
            return ['min' => (int) $m[1], 'max' => PHP_INT_MAX];
        }

        // "50-200" pattern
        if (preg_match('/^(\d+)\s*[-–—to]\s*(\d+)$/', $value, $m)) {
            return ['min' => (int) $m[1], 'max' => (int) $m[2]];
        }

        // "<100" pattern
        if (preg_match('/^[<≤]\s*(\d+)$/', $value, $m)) {
            return ['min' => 0, 'max' => (int) $m[1]];
        }

        // ">100" pattern
        if (preg_match('/^[>≥]\s*(\d+)$/', $value, $m)) {
            return ['min' => (int) $m[1], 'max' => PHP_INT_MAX];
        }

        // Single number
        if (is_numeric($value)) {
            $num = (int) $value;
            return ['min' => (int) ($num * 0.5), 'max' => (int) ($num * 1.5)];
        }

        return null;
    }

    /**
     * Simple text similarity (normalized Levenshtein).
     */
    private function textSimilarity(string $a, string $b): float
    {
        $maxLen = max(strlen($a), strlen($b));
        if ($maxLen === 0) return 1.0;

        $distance = levenshtein($a, $b);
        return 1.0 - ($distance / $maxLen);
    }
}
