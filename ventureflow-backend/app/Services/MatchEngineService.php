<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Services;

use App\Models\Investor;
use App\Models\Target;
use App\Models\DealMatch as MatchModel;
use App\Models\ExchangeRate;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * MatchIQ — Smart Matching Engine
 *
 * Scores every Investor ↔ Target pair across 4 weighted dimensions,
 * based on fields that actually exist in the registration forms:
 *
 *   1. Industry    (30%) — preferred industry vs target's actual industry
 *   2. Geography   (25%) — investor's target countries vs target's HQ country
 *   3. Financial   (25%) — investment budget vs desired investment (USD-normalised)
 *   4. Transaction (20%) — ownership structure + M&A purpose compatibility
 *
 * Each dimension scorer returns 0.0–1.0.
 * Weighted combination produces a final score 0–100.
 *
 * Industries are matched by ID first (exact), then by name (fuzzy).
 * Since industries are dynamic (admin-managed in Settings), ID-based
 * matching ensures renamed or consolidated industries propagate
 * automatically across all matches on the next rescan.
 */
class MatchEngineService
{
    // ─── Default Weights (must sum to 1.0) ──────────────────────────────

    public const DEFAULT_WEIGHTS = [
        'industry'    => 0.30,
        'geography'   => 0.25,
        'financial'   => 0.25,
        'transaction' => 0.20,
    ];

    // Minimum total score to persist a match (below this is noise)
    private const MIN_SCORE = 30;

    // M&A Purpose compatibility matrix:
    // Investor purpose → array of compatible Target reasons
    private const PURPOSE_COMPATIBILITY = [
        'strategic expansion'     => ['strategic partnership', 'market expansion', 'growth acceleration'],
        'market entry'            => ['market expansion', 'cross-border expansion', 'strategic partnership'],
        'talent acquisition'      => ['strategic partnership', 'growth acceleration'],
        'diversification'         => ['non-core divestment', 'market expansion', 'technology integration'],
        'technology acquisition'  => ['technology integration', 'strategic partnership'],
        'financial investment'    => ['full exit', 'partial exit', 'capital raising', "owner's retirement", 'business succession'],
    ];

    private IndustrySimilarityService $industrySimilarity;

    public function __construct(IndustrySimilarityService $industrySimilarity)
    {
        $this->industrySimilarity = $industrySimilarity;
    }

    // ─── Public API ─────────────────────────────────────────────────────

    /**
     * Compute matches for a specific investor against all active targets.
     * Returns the collection of upserted Match models.
     */
    public function computeMatchesForBuyer(Investor $investor, array $weights = []): Collection
    {
        $w = $this->resolveWeights($weights);
        $investor->load(['companyOverview', 'financialDetails']);

        $targets = Target::where('status', 1)
            ->with(['companyOverview', 'financialDetails'])
            ->get();

        $results = collect();

        foreach ($targets as $target) {
            try {
                $scores = $this->scoreMatch($investor, $target, $w);

                if ($scores['total_score'] >= self::MIN_SCORE) {
                    $match = MatchModel::updateOrCreate(
                        ['buyer_id' => $investor->id, 'seller_id' => $target->id],
                        array_merge(
                            array_diff_key($scores, ['explanations' => null]),
                            ['computed_at' => now()]
                        )
                    );

                    if ($match->wasRecentlyCreated) {
                        $match->update(['status' => 'pending']);
                    }

                    $results->push($match);
                }
            } catch (\Throwable $e) {
                Log::warning("MatchIQ: Failed scoring Investor#{$investor->id} vs Target#{$target->id}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Compute matches for a specific target against all active investors.
     */
    public function computeMatchesForSeller(Target $target, array $weights = []): Collection
    {
        $w = $this->resolveWeights($weights);
        $target->load(['companyOverview', 'financialDetails']);

        $investors = Investor::where('status', 1)
            ->with(['companyOverview', 'financialDetails'])
            ->get();

        $results = collect();

        foreach ($investors as $investor) {
            try {
                $scores = $this->scoreMatch($investor, $target, $w);

                if ($scores['total_score'] >= self::MIN_SCORE) {
                    $match = MatchModel::updateOrCreate(
                        ['buyer_id' => $investor->id, 'seller_id' => $target->id],
                        array_merge(
                            array_diff_key($scores, ['explanations' => null]),
                            ['computed_at' => now()]
                        )
                    );

                    if ($match->wasRecentlyCreated) {
                        $match->update(['status' => 'pending']);
                    }

                    $results->push($match);
                }
            } catch (\Throwable $e) {
                Log::warning("MatchIQ: Failed scoring Investor#{$investor->id} vs Target#{$target->id}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Full rescan: score every investor × target pair.
     */
    public function fullRescan(array $weights = []): int
    {
        $w = $this->resolveWeights($weights);

        $investors = Investor::where('status', 1)
            ->with(['companyOverview', 'financialDetails'])
            ->get();

        $targets = Target::where('status', 1)
            ->with(['companyOverview', 'financialDetails'])
            ->get();

        $count = 0;

        foreach ($investors as $investor) {
            foreach ($targets as $target) {
                try {
                    $scores = $this->scoreMatch($investor, $target, $w);

                    if ($scores['total_score'] >= self::MIN_SCORE) {
                        MatchModel::updateOrCreate(
                            ['buyer_id' => $investor->id, 'seller_id' => $target->id],
                            array_merge(
                                array_diff_key($scores, ['explanations' => null]),
                                ['computed_at' => now()]
                            )
                        );
                        $count++;
                    }
                } catch (\Throwable $e) {
                    Log::warning("MatchIQ Rescan: Failed Investor#{$investor->id} vs Target#{$target->id}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        return $count;
    }

    /**
     * Score a single investor-target pair.
     * Accepts optional weights to override defaults.
     * Returns all dimension scores + total + human-readable explanations.
     */
    public function scoreMatch(Investor $investor, Target $target, array $weights = []): array
    {
        $w = $this->resolveWeights($weights);

        [$industry,    $indExp]  = $this->scoreIndustry($investor, $target);
        [$geography,   $geoExp]  = $this->scoreGeography($investor, $target);
        [$financial,   $finExp]  = $this->scoreFinancial($investor, $target);
        [$transaction, $txnExp]  = $this->scoreTransaction($investor, $target);

        $totalScore = (int) round(
            ($industry    * $w['industry']    +
             $geography   * $w['geography']   +
             $financial   * $w['financial']   +
             $transaction * $w['transaction']) * 100
        );

        return [
            'total_score'       => min(100, max(0, $totalScore)),
            'industry_score'    => round($industry, 4),
            'geography_score'   => round($geography, 4),
            'financial_score'   => round($financial, 4),
            'transaction_score' => round($transaction, 4),
            'explanations'      => [
                'industry'    => $indExp,
                'geography'   => $geoExp,
                'financial'   => $finExp,
                'transaction' => $txnExp,
            ],
        ];
    }

    // ─── Weight Helpers ─────────────────────────────────────────────────

    /**
     * Validate and normalise custom weights, falling back to defaults.
     */
    private function resolveWeights(array $weights): array
    {
        if (empty($weights)) return self::DEFAULT_WEIGHTS;

        $keys = array_keys(self::DEFAULT_WEIGHTS);
        $resolved = [];
        foreach ($keys as $key) {
            $resolved[$key] = isset($weights[$key]) ? (float) $weights[$key] : self::DEFAULT_WEIGHTS[$key];
        }

        $sum = array_sum($resolved);
        if (abs($sum - 1.0) > 0.05) {
            // Normalise if they don't sum to ~1.0
            foreach ($resolved as &$v) {
                $v = $v / $sum;
            }
        }

        return $resolved;
    }

    // ─── Dimension Scorers ──────────────────────────────────────────────

    /**
     * DIMENSION 1: Industry Match (0.0–1.0)
     *
     * Compares investor's preferred industries against target's actual industries.
     * Primary match: by industry ID (exact, propagates admin renames automatically).
     * Fallback: by industry name (fuzzy Levenshtein).
     *
     * Uses two investor fields: main_industry_operations + company_industry.
     * Uses one target field: industry_ops.
     */
    private function scoreIndustry(Investor $investor, Target $target): array
    {
        $investorIndustries = $this->extractInvestorIndustries($investor);
        $targetIndustries   = $this->extractTargetIndustries($target);

        if (empty($investorIndustries)) {
            return [0.0, 'Industry: Investor has no industry preference set'];
        }
        if (empty($targetIndustries)) {
            return [0.0, 'Industry: Target has no industry listed'];
        }

        // Separate canonical IDs (small integers from industries table) from adhoc IDs (timestamps)
        $isAdhocId = fn($id) => is_numeric($id) && $id > 9999999999; // timestamp-based IDs > 10 digits

        $investorCanonicalIds = array_filter(
            array_column($investorIndustries, 'id'),
            fn($id) => $id !== null && !$isAdhocId($id)
        );
        $targetCanonicalIds = array_filter(
            array_column($targetIndustries, 'id'),
            fn($id) => $id !== null && !$isAdhocId($id)
        );

        // --- ID-based exact match (only for canonical industry IDs) ---
        if (!empty($investorCanonicalIds) && !empty($targetCanonicalIds)) {
            $intersection = count(array_intersect($investorCanonicalIds, $targetCanonicalIds));
            $union        = count(array_unique(array_merge($investorCanonicalIds, $targetCanonicalIds)));
            $idScore      = $union > 0 ? $intersection / $union : 0.0;

            if ($idScore > 0) {
                $matched = array_intersect($investorCanonicalIds, $targetCanonicalIds);
                $names   = array_map(fn($item) => $item['name'] ?? 'Unknown',
                    array_filter($targetIndustries, fn($i) => in_array($i['id'], $matched)));
                $nameStr = implode(', ', $names) ?: 'Matched industries';
                return [
                    min(1.0, $idScore),
                    "Industry: {$nameStr} — exact match by industry ID"
                ];
            }
        }

        // --- Name-based matching (handles adhoc industries from imports) ---
        $investorNames = array_values(array_filter(
            array_map(fn($s) => mb_strtolower(trim($s['name'] ?? '')), $investorIndustries)
        ));
        $targetNames = array_values(array_filter(
            array_map(fn($s) => mb_strtolower(trim($s['name'] ?? '')), $targetIndustries)
        ));

        if (empty($investorNames) || empty($targetNames)) {
            return [0.0, 'Industry: Insufficient name data for matching'];
        }

        // Exact name match (Jaccard)
        $intersection = count(array_intersect($investorNames, $targetNames));
        $union = count(array_unique(array_merge($investorNames, $targetNames)));
        if ($intersection > 0) {
            return [
                min(1.0, $intersection / $union),
                'Industry: Exact name match — "' . implode(', ', array_intersect($investorNames, $targetNames)) . '"'
            ];
        }

        // Smart similarity using IndustrySimilarityService (handles adhoc vs canonical names)
        $primaryIndustries = \App\Models\Industry::where('status', 1)->get();
        $bestScore = 0.0;
        $bestExplanation = '';

        // Try matching each target industry name against investor's industries
        foreach ($targetNames as $tName) {
            // Use IndustrySimilarityService to find if tName maps to any investor industry
            foreach ($investorNames as $iName) {
                // Direct Levenshtein
                $sim = $this->textSimilarity($iName, $tName);
                if ($sim > $bestScore) {
                    $bestScore = $sim;
                    $bestExplanation = "Industry: Similar names — \"{$tName}\" ≈ \"{$iName}\"";
                }
                // Token overlap (catches 'Water Electric' vs 'Electric Power Generation')
                $tTokens = array_filter(explode(' ', $tName), fn($w) => strlen($w) >= 4);
                $iTokens = array_filter(explode(' ', $iName), fn($w) => strlen($w) >= 4);
                if (!empty($tTokens) && !empty($iTokens)) {
                    $tokenOverlap = count(array_intersect($tTokens, $iTokens))
                        / count(array_unique(array_merge($tTokens, $iTokens)));
                    if ($tokenOverlap > $bestScore) {
                        $bestScore = $tokenOverlap;
                        $bestExplanation = "Industry: Token overlap — \"{$tName}\" shares terms with \"{$iName}\"";
                    }
                }
            }

            // Also try matching target's adhoc name against investor's canonical industry sub-industries
            $suggestions = $this->industrySimilarity->suggest($tName, $primaryIndustries);
            foreach ($suggestions as $suggestion) {
                // Check if the suggested canonical industry is one investor is interested in
                $suggestedId = $suggestion['id'];
                if (in_array($suggestedId, array_column($investorIndustries, 'id'), true)) {
                    $simScore = $suggestion['score'] / 100.0;
                    if ($simScore > $bestScore) {
                        $bestScore = $simScore;
                        $bestExplanation = "Industry: Adhoc '{$tName}' maps to '{$suggestion['name']}' (investor preference)";
                    }
                }
                // Also check sub-industry names
                foreach ($investorNames as $iName) {
                    if (mb_strtolower($suggestion['name']) === mb_strtolower($iName)) {
                        $simScore = $suggestion['score'] / 100.0;
                        if ($simScore > $bestScore) {
                            $bestScore = $simScore;
                            $bestExplanation = "Industry: '{$tName}' matches investor industry '{$iName}' via similarity";
                        }
                    }
                }
            }
        }

        if ($bestScore > 0.3) {
            return [min(1.0, $bestScore), $bestExplanation];
        }

        return [0.0, 'Industry: No significant industry overlap found'];
    }

    /**
     * DIMENSION 2: Geography Match (0.0–1.0)
     *
     * Checks if target's HQ country is in investor's list of target countries.
     */
    private function scoreGeography(Investor $investor, Target $target): array
    {
        $investorCountries = $this->extractInvestorCountries($investor);

        if (empty($investorCountries)) {
            return [0.0, 'Geography: Investor has no target country preference'];
        }

        $targetHq = $target->companyOverview?->hq_country;
        if (empty($targetHq)) {
            return [0.0, 'Geography: Target has no HQ country on record'];
        }

        $targetHqStr = strval($targetHq);

        if (in_array($targetHqStr, $investorCountries, true)) {
            return [1.0, "Geography: Target HQ country matches investor's target countries"];
        }

        return [0.0, 'Geography: Target HQ country not in investor\'s target countries'];
    }

    /**
     * DIMENSION 3: Financial Fit (0.0–1.0)
     *
     * Compares investor's investment budget vs target's desired investment amount.
     * Both sides are normalised to USD using the exchange_rates table before comparison.
     * EBITDA is NOT considered (as per engine redesign).
     */
    private function scoreFinancial(Investor $investor, Target $target): array
    {
        $buyerBudget  = $this->toArray($investor->companyOverview?->investment_budget);
        $sellerAmount = $this->toArray($target->financialDetails?->expected_investment_amount);

        if (empty($buyerBudget) && empty($sellerAmount)) {
            return [0.0, 'Financial: No financial data available'];
        }
        if (empty($buyerBudget)) {
            return [0.0, 'Financial: Investor has no budget set'];
        }
        if (empty($sellerAmount)) {
            return [0.0, 'Financial: Target has no investment amount set'];
        }

        // Get currencies
        $investorCurrency = $investor->financialDetails?->default_currency
                         ?? $investor->financialDetails?->register_currency
                         ?? 'USD';
        $targetCurrency   = $target->financialDetails?->default_currency ?? 'USD';

        // Extract raw values
        $budgetMinRaw = (float) ($buyerBudget['min'] ?? $buyerBudget[0] ?? 0);
        $budgetMaxRaw = (float) ($buyerBudget['max'] ?? $buyerBudget[1] ?? PHP_FLOAT_MAX);
        $sellerMinRaw = (float) ($sellerAmount['min'] ?? $sellerAmount[0] ?? 0);
        $sellerMaxRaw = (float) ($sellerAmount['max'] ?? $sellerAmount[1] ?? $sellerMinRaw);

        // Convert to USD
        $budgetMin = ExchangeRate::toUsd($budgetMinRaw, $investorCurrency);
        $budgetMax = $budgetMaxRaw >= PHP_FLOAT_MAX
            ? PHP_FLOAT_MAX
            : ExchangeRate::toUsd($budgetMaxRaw, $investorCurrency);
        $sellerMin = ExchangeRate::toUsd($sellerMinRaw, $targetCurrency);
        $sellerMax = ExchangeRate::toUsd($sellerMaxRaw, $targetCurrency);

        // Compare ranges
        if ($sellerMin >= $budgetMin && $sellerMax <= $budgetMax) {
            return [1.0, 'Financial: Deal size fits investor budget perfectly (USD-normalised)'];
        }
        if ($sellerMin <= $budgetMax && $sellerMax >= $budgetMin) {
            return [0.7, 'Financial: Partial budget overlap (USD-normalised)'];
        }

        // Logarithmic proximity for more realistic curve
        $gap = min(abs($sellerMin - $budgetMax), abs($sellerMax - $budgetMin));
        $midBudget = max(($budgetMax + $budgetMin) / 2, 1);
        $relativeGap = $gap / $midBudget;
        $proximity = max(0, 1 - log1p($relativeGap * 10) / log1p(10));
        return [$proximity * 0.4, 'Financial: Deal size outside investor budget (USD-normalised)'];
    }

    /**
     * DIMENSION 4: Transaction Fit (0.0–1.0)
     *
     * Combined score from two sub-dimensions:
     *   60% — Ownership structure compatibility (investment_condition)
     *   40% — M&A purpose alignment (reason_ma)
     *
     * Replaces the old «Ownership» dimension.
     */
    private function scoreTransaction(Investor $investor, Target $target): array
    {
        [$structureScore, $structureExp] = $this->scoreStructure($investor, $target);
        [$purposeScore,   $purposeExp]  = $this->scorePurpose($investor, $target);

        $combined = ($structureScore * 0.6) + ($purposeScore * 0.4);

        return [$combined, "Transaction: {$structureExp}; {$purposeExp}"];
    }

    /**
     * Sub-scorer: Ownership Structure Compatibility (0.0–1.0)
     *
     * Compares investment_condition from both sides.
     * Investor's investment_condition: from CompanyOverview
     * Target's investment_condition: from FinancialDetails
     */
    private function scoreStructure(Investor $investor, Target $target): array
    {
        $investorConditions = $this->parseMultiValue(
            $investor->companyOverview?->investment_condition
        );
        $targetConditions = $this->parseMultiValue(
            $target->financialDetails?->investment_condition
        );

        if (empty($investorConditions) && empty($targetConditions)) {
            return [0.0, 'Structure: No preference set'];
        }

        // Flexible on either side = high compatibility
        $investorFlexible = $this->hasFlexible($investorConditions);
        $targetFlexible   = $this->hasFlexible($targetConditions);

        if ($investorFlexible || $targetFlexible) {
            $who = $investorFlexible ? 'Investor' : 'Target';
            return [0.9, "Structure: {$who} is flexible"];
        }

        if (empty($investorConditions) || empty($targetConditions)) {
            return [0.0, 'Structure: One side has no condition specified'];
        }

        // Normalize for comparison
        $invNorm = array_map(fn($s) => mb_strtolower(trim($s)), $investorConditions);
        $tgtNorm = array_map(fn($s) => mb_strtolower(trim($s)), $targetConditions);

        // Exact overlap
        $overlap = array_intersect($invNorm, $tgtNorm);
        if (!empty($overlap)) {
            $matched = implode(', ', $overlap);
            return [1.0, "Structure: Both agree on — {$matched}"];
        }

        // Partial compatibility
        $invMajority = $this->hasMajority($invNorm);
        $tgtMajority = $this->hasMajority($tgtNorm);
        $invMinority = $this->hasMinority($invNorm);
        $tgtMinority = $this->hasMinority($tgtNorm);

        if ($invMajority && $tgtMajority) return [0.9, 'Structure: Both open to majority acquisition'];
        if ($invMinority && $tgtMinority) return [0.9, 'Structure: Both open to minority stake'];
        if ($invMajority && $tgtMinority) return [0.2, 'Structure: Investor wants majority; target prefers minority'];
        if ($invMinority && $tgtMajority) return [0.2, 'Structure: Investor wants minority; target requires majority'];

        // Text similarity fallback
        $best = 0.0;
        foreach ($invNorm as $iCond) {
            foreach ($tgtNorm as $tCond) {
                $best = max($best, $this->textSimilarity($iCond, $tCond));
            }
        }
        return [$best * 0.7, 'Structure: Partial compatibility'];
    }

    /**
     * Sub-scorer: M&A Purpose Alignment (0.0–1.0)
     *
     * Cross-matches investor reason_ma against target reason_ma
     * using a predefined compatibility matrix.
     */
    private function scorePurpose(Investor $investor, Target $target): array
    {
        $investorPurposes = $this->parseMultiValue(
            $investor->companyOverview?->reason_ma
        );
        $targetReasons = $this->parseMultiValue(
            $target->companyOverview?->reason_ma
        );

        if (empty($investorPurposes) && empty($targetReasons)) {
            return [0.0, 'Purpose: No M&A purpose specified'];
        }
        if (empty($investorPurposes)) {
            return [0.0, 'Purpose: Investor has no M&A purpose set'];
        }
        if (empty($targetReasons)) {
            return [0.0, 'Purpose: Target has no M&A reason set'];
        }

        $invNorm = array_map(fn($s) => mb_strtolower(trim($s)), $investorPurposes);
        $tgtNorm = array_map(fn($s) => mb_strtolower(trim($s)), $targetReasons);

        $bestScore = 0.0;
        $bestExplanation = '';

        foreach ($invNorm as $invPurpose) {
            // Check compatibility matrix
            $compatible = self::PURPOSE_COMPATIBILITY[$invPurpose] ?? null;

            if ($compatible === null) {
                // "Other" or unrecognised — low compatibility
                if ($bestScore < 0.15) {
                    $bestScore = 0.15;
                    $bestExplanation = "Purpose: \"{$invPurpose}\" — unrecognised purpose";
                }
                continue;
            }

            foreach ($tgtNorm as $tgtReason) {
                if (in_array($tgtReason, $compatible, true)) {
                    // Strong compatibility
                    return [0.9, "Purpose: Investor \"{$invPurpose}\" aligns with target \"{$tgtReason}\""];
                }

                // Try partial text match for close but not exact values
                foreach ($compatible as $compatItem) {
                    $sim = $this->textSimilarity($tgtReason, $compatItem);
                    if ($sim > 0.7 && $sim > $bestScore) {
                        $bestScore = $sim * 0.85;
                        $bestExplanation = "Purpose: \"{$tgtReason}\" partially matches \"{$compatItem}\"";
                    }
                }
            }
        }

        if ($bestScore > 0.3) {
            return [$bestScore, $bestExplanation];
        }

        return [0.05, 'Purpose: No M&A purpose alignment found'];
    }

    // ─── Data Extraction Helpers ────────────────────────────────────────

    /**
     * Extract investor's target industries.
     * Sources: main_industry_operations (primary) + company_industry (secondary)
     * Returns array of ['id' => int|null, 'name' => string]
     */
    private function extractInvestorIndustries(Investor $investor): array
    {
        $industries = [];

        // Primary: investor's target industry preferences
        $mainOps = $this->toArray($investor->companyOverview?->main_industry_operations);
        foreach ($mainOps as $item) {
            if (is_array($item)) {
                $industries[] = ['id' => $item['id'] ?? null, 'name' => $item['name'] ?? ''];
            } elseif (is_string($item)) {
                $industries[] = ['id' => null, 'name' => $item];
            }
        }

        // Secondary: investor's own company industry
        $compInd = $this->toArray($investor->companyOverview?->company_industry);
        foreach ($compInd as $item) {
            if (is_array($item)) {
                $industries[] = ['id' => $item['id'] ?? null, 'name' => $item['name'] ?? ''];
            } elseif (is_string($item)) {
                $industries[] = ['id' => null, 'name' => $item];
            }
        }

        return array_values(array_filter($industries, fn($i) => !empty($i['name'])));
    }

    /**
     * Extract target's industries.
     * Source: industry_ops (from Target registration's "Broader Industries" field)
     * Returns array of ['id' => int|null, 'name' => string]
     */
    private function extractTargetIndustries(Target $target): array
    {
        $industries = [];

        $ops = $this->toArray($target->companyOverview?->industry_ops);
        foreach ($ops as $item) {
            if (is_array($item)) {
                $industries[] = ['id' => $item['id'] ?? null, 'name' => $item['name'] ?? ''];
            } elseif (is_string($item)) {
                $industries[] = ['id' => null, 'name' => $item];
            }
        }

        return array_values(array_filter($industries, fn($i) => !empty($i['name'])));
    }

    /**
     * Extract investor's target countries as string IDs.
     * Source: target_countries from CompanyOverview
     */
    private function extractInvestorCountries(Investor $investor): array
    {
        $countries = [];
        $coCountries = $this->toArray($investor->companyOverview?->target_countries);

        foreach ($coCountries as $item) {
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

        return array_values(array_unique(array_filter($countries)));
    }

    // ─── Structure Helpers ──────────────────────────────────────────────

    private function hasFlexible(array $conditions): bool
    {
        foreach ($conditions as $c) {
            if ($this->isFlexible($c)) return true;
        }
        return false;
    }

    private function isFlexible(string $condition): bool
    {
        $norm = mb_strtolower(trim($condition));
        return str_contains($norm, 'flexible') || str_contains($norm, 'negotiable') || str_contains($norm, 'open');
    }

    private function hasMajority(array $conditions): bool
    {
        foreach ($conditions as $c) {
            if (str_contains($c, 'majority') || str_contains($c, 'full acquisition') || str_contains($c, '51')) {
                return true;
            }
        }
        return false;
    }

    private function hasMinority(array $conditions): bool
    {
        foreach ($conditions as $c) {
            if (str_contains($c, 'minority') || str_contains($c, '<50')) {
                return true;
            }
        }
        return false;
    }

    // ─── Value Parsers ───────────────────────────────────────────────────

    /**
     * Parse a multi-value field (stored as JSON array of strings, or a single string).
     */
    private function parseMultiValue(mixed $value): array
    {
        if (empty($value)) return [];
        if (is_array($value)) return array_values(array_filter($value));
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) return array_values(array_filter($decoded));
            return [$value];
        }
        return [];
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
