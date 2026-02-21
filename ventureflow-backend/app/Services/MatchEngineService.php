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
 * Scores every Investor ↔ Target pair across 4 weighted dimensions,
 * based on fields that actually exist in the registration forms:
 *
 *   1. Industry  (35%) — preferred industry vs target's actual industry
 *   2. Geography (30%) — investor's target countries vs target's HQ country
 *   3. Financial (25%) — investment budget vs desired investment + EBITDA
 *   4. Ownership (10%) — investment condition / stake compatibility
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
    // ─── Configurable Weights (must sum to 1.0) ─────────────────────────

    private const WEIGHTS = [
        'industry'  => 0.35,
        'geography' => 0.30,
        'financial' => 0.25,
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
     * Compute matches for a specific investor against all active targets.
     * Returns the collection of upserted Match models.
     */
    public function computeMatchesForBuyer(Investor $investor): Collection
    {
        $investor->load(['companyOverview', 'financialDetails']);

        $targets = Target::where('status', 1)
            ->with(['companyOverview', 'financialDetails'])
            ->get();

        $results = collect();

        foreach ($targets as $target) {
            try {
                $scores = $this->scoreMatch($investor, $target);

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
    public function computeMatchesForSeller(Target $target): Collection
    {
        $target->load(['companyOverview', 'financialDetails']);

        $investors = Investor::where('status', 1)
            ->with(['companyOverview', 'financialDetails'])
            ->get();

        $results = collect();

        foreach ($investors as $investor) {
            try {
                $scores = $this->scoreMatch($investor, $target);

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
    public function fullRescan(): int
    {
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
                    $scores = $this->scoreMatch($investor, $target);

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
     * Returns all dimension scores + total + human-readable explanations.
     */
    public function scoreMatch(Investor $investor, Target $target): array
    {
        [$industry,  $indExp]  = $this->scoreIndustry($investor, $target);
        [$geography, $geoExp]  = $this->scoreGeography($investor, $target);
        [$financial, $finExp]  = $this->scoreFinancial($investor, $target);
        [$ownership, $ownExp]  = $this->scoreOwnership($investor, $target);

        $totalScore = (int) round(
            ($industry  * self::WEIGHTS['industry']  +
             $geography * self::WEIGHTS['geography'] +
             $financial * self::WEIGHTS['financial'] +
             $ownership * self::WEIGHTS['ownership']) * 100
        );

        return [
            'total_score'      => min(100, max(0, $totalScore)),
            'industry_score'   => round($industry, 4),
            'geography_score'  => round($geography, 4),
            'financial_score'  => round($financial, 4),
            'ownership_score'  => round($ownership, 4),
            'explanations'     => [
                'industry'  => $indExp,
                'geography' => $geoExp,
                'financial' => $finExp,
                'ownership' => $ownExp,
            ],
        ];
    }

    /**
     * Score with custom criteria override (for the Investor Criteria filter panel).
     * Criteria fields override the investor's stored preferences at query time.
     * Results are NOT stored to the database.
     *
     * @param Investor $investor
     * @param array    $criteria  Keys: industry_ids[], target_countries[], ebitda_min, budget_min, budget_max, ownership_condition
     * @return array   Scored target list with scores and explanations
     */
    public function scoreWithCriteria(Investor $investor, array $criteria): array
    {
        $targets = Target::where('status', 1)
            ->with(['companyOverview', 'financialDetails'])
            ->get();

        $results = [];

        foreach ($targets as $target) {
            try {
                [$industry,  $indExp]  = $this->scoreIndustryWithCriteria($criteria, $target);
                [$geography, $geoExp]  = $this->scoreGeographyWithCriteria($criteria, $target);
                [$financial, $finExp]  = $this->scoreFinancialWithCriteria($criteria, $investor, $target);
                [$ownership, $ownExp]  = $this->scoreOwnershipWithCriteria($criteria, $target);

                $totalScore = (int) round(
                    ($industry  * self::WEIGHTS['industry']  +
                     $geography * self::WEIGHTS['geography'] +
                     $financial * self::WEIGHTS['financial'] +
                     $ownership * self::WEIGHTS['ownership']) * 100
                );

                $totalScore = min(100, max(0, $totalScore));

                if ($totalScore >= self::MIN_SCORE) {
                    $results[] = [
                        'target_id'       => $target->id,
                        'total_score'     => $totalScore,
                        'industry_score'  => round($industry, 4),
                        'geography_score' => round($geography, 4),
                        'financial_score' => round($financial, 4),
                        'ownership_score' => round($ownership, 4),
                        'explanations'    => [
                            'industry'  => $indExp,
                            'geography' => $geoExp,
                            'financial' => $finExp,
                            'ownership' => $ownExp,
                        ],
                        'target'          => $target,
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning("MatchIQ Custom Score: Failed Investor#{$investor->id} vs Target#{$target->id}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        usort($results, fn($a, $b) => $b['total_score'] <=> $a['total_score']);

        return $results;
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
            return [0.5, 'Industry: Investor has no industry preference set (neutral)'];
        }
        if (empty($targetIndustries)) {
            return [0.3, 'Industry: Target has no industry listed'];
        }

        // --- ID-based exact match (preferred — survives industry renames) ---
        $investorIds = array_filter(array_column($investorIndustries, 'id'));
        $targetIds   = array_filter(array_column($targetIndustries, 'id'));

        if (!empty($investorIds) && !empty($targetIds)) {
            $intersection = count(array_intersect($investorIds, $targetIds));
            $union        = count(array_unique(array_merge($investorIds, $targetIds)));
            $idScore      = $union > 0 ? $intersection / $union : 0.0;

            if ($idScore > 0) {
                $matched = array_intersect($investorIds, $targetIds);
                $names   = array_map(fn($item) => $item['name'] ?? 'Unknown',
                    array_filter($targetIndustries, fn($i) => in_array($i['id'], $matched)));
                $nameStr = implode(', ', $names) ?: 'Matched industries';
                return [
                    min(1.0, $idScore + 0.2),
                    "Industry: {$nameStr} — exact match by industry ID"
                ];
            }
        }

        // --- Name-based fuzzy fallback ---
        $investorNames = array_map(fn($s) => mb_strtolower(trim($s['name'] ?? '')), $investorIndustries);
        $targetNames   = array_map(fn($s) => mb_strtolower(trim($s['name'] ?? '')), $targetIndustries);
        $investorNames = array_filter($investorNames);
        $targetNames   = array_filter($targetNames);

        // Jaccard on names
        $intersection = count(array_intersect($investorNames, $targetNames));
        $union = count(array_unique(array_merge($investorNames, $targetNames)));
        $exactScore = $union > 0 ? $intersection / $union : 0.0;

        if ($exactScore > 0) {
            return [
                min(1.0, $exactScore + 0.1),
                'Industry: Name overlap — "' . implode(', ', array_intersect($investorNames, $targetNames)) . '"'
            ];
        }

        // Levenshtein similarity
        $best = 0.0;
        $bestPair = ['', ''];
        foreach ($targetNames as $tName) {
            foreach ($investorNames as $iName) {
                $sim = $this->textSimilarity($iName, $tName);
                if ($sim > $best) {
                    $best = $sim;
                    $bestPair = [$iName, $tName];
                }
            }
        }

        if ($best > 0.5) {
            return [$best, "Industry: Similar — \"{$bestPair[1]}\" ≈ \"{$bestPair[0]}\""];
        }

        return [0.1, 'Industry: No industry overlap found'];
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
            return [0.5, 'Geography: Investor has no target country preference (neutral)'];
        }

        $targetHq = $target->companyOverview?->hq_country;
        if (empty($targetHq)) {
            return [0.3, 'Geography: Target has no HQ country on record'];
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
     * Checks overlap between:
     *   - Investor's investment budget (min/max) from investment_budget
     *   - Target's desired investment amount (min/max) from expected_investment_amount
     *   - Target's EBITDA from ebitda_value (used as quality filter)
     */
    private function scoreFinancial(Investor $investor, Target $target): array
    {
        $scores = [];
        $explanations = [];

        // Sub-check A: Budget vs Expected Amount
        [$budgetScore, $budgetExp] = $this->scoreBudgetFit($investor, $target);
        if ($budgetScore !== null) {
            $scores[] = $budgetScore;
            $explanations[] = $budgetExp;
        }

        // Sub-check B: EBITDA presence/quality
        [$ebitdaScore, $ebitdaExp] = $this->scoreEbitdaPresence($target);
        if ($ebitdaScore !== null) {
            $scores[] = $ebitdaScore;
            $explanations[] = $ebitdaExp;
        }

        if (empty($scores)) {
            return [0.5, 'Financial: No financial data available (neutral)'];
        }

        $avg = array_sum($scores) / count($scores);
        return [$avg, 'Financial: ' . implode('; ', $explanations)];
    }

    /**
     * DIMENSION 4: Ownership Structure Compatibility (0.0–1.0)
     *
     * Compares investment_condition from both sides.
     * Both use the same dropdown values from registration forms:
     *   Minority (<50%), Significant minority (25–49%), Joint control (51/49),
     *   Majority (51–99%), Full acquisition (100%), Flexible
     */
    private function scoreOwnership(Investor $investor, Target $target): array
    {
        $investorConditions = $this->parseMultiValue(
            $investor->companyOverview?->investment_condition
        );
        $targetConditions = $this->parseMultiValue(
            $target->financialDetails?->investment_condition
        );

        if (empty($investorConditions) && empty($targetConditions)) {
            return [0.5, 'Ownership: No ownership preference set (neutral)'];
        }

        // Flexible on either side = high compatibility
        $investorFlexible = $this->hasFlexible($investorConditions);
        $targetFlexible   = $this->hasFlexible($targetConditions);

        if ($investorFlexible || $targetFlexible) {
            $who = $investorFlexible ? 'Investor' : 'Target';
            return [0.9, "Ownership: {$who} is flexible on ownership structure"];
        }

        if (empty($investorConditions) || empty($targetConditions)) {
            return [0.5, 'Ownership: One side has no condition specified (neutral)'];
        }

        // Normalize for comparison
        $invNorm = array_map(fn($s) => mb_strtolower(trim($s)), $investorConditions);
        $tgtNorm = array_map(fn($s) => mb_strtolower(trim($s)), $targetConditions);

        // Exact overlap
        $overlap = array_intersect($invNorm, $tgtNorm);
        if (!empty($overlap)) {
            $matched = implode(', ', $overlap);
            return [1.0, "Ownership: Both agree on — {$matched}"];
        }

        // Partial compatibility (minority ↔ majority incompatible; joint ↔ either = partial)
        $invMajority = $this->hasMajority($invNorm);
        $tgtMajority = $this->hasMajority($tgtNorm);
        $invMinority = $this->hasMinority($invNorm);
        $tgtMinority = $this->hasMinority($tgtNorm);

        if ($invMajority && $tgtMajority) return [0.9, 'Ownership: Both open to majority acquisition'];
        if ($invMinority && $tgtMinority) return [0.9, 'Ownership: Both open to minority stake'];
        if ($invMajority && $tgtMinority) return [0.2, 'Ownership: Investor wants majority; target prefers minority'];
        if ($invMinority && $tgtMajority) return [0.2, 'Ownership: Investor wants minority; target requires majority'];

        // Text similarity fallback
        $best = 0.0;
        foreach ($invNorm as $iCond) {
            foreach ($tgtNorm as $tCond) {
                $best = max($best, $this->textSimilarity($iCond, $tCond));
            }
        }
        return [$best * 0.7, 'Ownership: Partial compatibility — different conditions'];
    }

    // ─── Criteria-Override Scorers (for custom scoring endpoint) ────────

    private function scoreIndustryWithCriteria(array $criteria, Target $target): array
    {
        $criteriaIds = $criteria['industry_ids'] ?? [];
        if (empty($criteriaIds)) return [0.5, 'Industry: No industry criteria specified (neutral)'];

        $targetIndustries = $this->extractTargetIndustries($target);
        $targetIds = array_filter(array_column($targetIndustries, 'id'));

        if (empty($targetIds)) return [0.3, 'Industry: Target has no industry listed'];

        $intersection = count(array_intersect($criteriaIds, $targetIds));
        $union = count(array_unique(array_merge($criteriaIds, $targetIds)));
        $score = $union > 0 ? $intersection / $union : 0.0;

        if ($score > 0) {
            return [min(1.0, $score + 0.2), "Industry: {$intersection} industry match(es) found"];
        }

        return [0.1, 'Industry: No industry overlap with criteria'];
    }

    private function scoreGeographyWithCriteria(array $criteria, Target $target): array
    {
        $criteriaCountries = array_map('strval', $criteria['target_countries'] ?? []);
        if (empty($criteriaCountries)) return [0.5, 'Geography: No country criteria specified (neutral)'];

        $targetHq = strval($target->companyOverview?->hq_country ?? '');
        if (empty($targetHq)) return [0.3, 'Geography: Target has no HQ country on record'];

        if (in_array($targetHq, $criteriaCountries, true)) {
            return [1.0, 'Geography: Target HQ matches criteria countries'];
        }

        return [0.0, 'Geography: Target HQ not in criteria countries'];
    }

    private function scoreFinancialWithCriteria(array $criteria, Investor $investor, Target $target): array
    {
        $scores = [];
        $explanations = [];

        // Budget override from criteria (or fall back to investor's stored values)
        $budgetMin = isset($criteria['budget_min']) ? (float) $criteria['budget_min']
            : $this->extractBudgetMin($investor);
        $budgetMax = isset($criteria['budget_max']) ? (float) $criteria['budget_max']
            : $this->extractBudgetMax($investor);

        $sellerAmount = $this->toArray($target->financialDetails?->expected_investment_amount);
        if (!empty($sellerAmount) && ($budgetMin > 0 || $budgetMax > 0)) {
            $sellerMin = (float) ($sellerAmount['min'] ?? $sellerAmount[0] ?? 0);
            $sellerMax = (float) ($sellerAmount['max'] ?? $sellerAmount[1] ?? $sellerMin);

            if ($sellerMin >= $budgetMin && $sellerMax <= $budgetMax) {
                $scores[] = 1.0;
                $explanations[] = "Deal size fits criteria budget";
            } elseif ($sellerMin <= $budgetMax && $sellerMax >= $budgetMin) {
                $scores[] = 0.7;
                $explanations[] = "Partial budget overlap";
            } else {
                $scores[] = 0.1;
                $explanations[] = "Deal size outside criteria budget";
            }
        }

        // EBITDA minimum filter from criteria
        if (isset($criteria['ebitda_min']) && $criteria['ebitda_min'] > 0) {
            $ebitdaMin = (float) $criteria['ebitda_min'];
            $targetEbitda = $this->toArray($target->financialDetails?->ebitda_value);
            $targetEbitdaVal = (float) ($targetEbitda['min'] ?? $targetEbitda[0] ?? 0);

            if ($targetEbitdaVal >= $ebitdaMin) {
                $scores[] = 1.0;
                $explanations[] = "EBITDA meets minimum";
            } else {
                $scores[] = max(0, $targetEbitdaVal / $ebitdaMin);
                $explanations[] = "EBITDA below minimum";
            }
        }

        if (empty($scores)) return [0.5, 'Financial: No financial criteria specified (neutral)'];

        $avg = array_sum($scores) / count($scores);
        return [$avg, 'Financial: ' . implode('; ', $explanations)];
    }

    private function scoreOwnershipWithCriteria(array $criteria, Target $target): array
    {
        $criteriaCondition = $criteria['ownership_condition'] ?? '';
        if (empty($criteriaCondition)) return [0.5, 'Ownership: No ownership criteria specified (neutral)'];

        $targetConditions = $this->parseMultiValue($target->financialDetails?->investment_condition);
        if (empty($targetConditions)) return [0.5, 'Ownership: Target has no condition specified (neutral)'];

        $critNorm = mb_strtolower(trim($criteriaCondition));

        if ($this->isFlexible($criteriaCondition) || $this->hasFlexible($targetConditions)) {
            return [0.9, 'Ownership: Flexible on ownership structure'];
        }

        $tgtNorm = array_map(fn($s) => mb_strtolower(trim($s)), $targetConditions);

        if (in_array($critNorm, $tgtNorm, true)) {
            return [1.0, "Ownership: Exact match — {$criteriaCondition}"];
        }

        $best = 0.0;
        foreach ($tgtNorm as $t) {
            $best = max($best, $this->textSimilarity($critNorm, $t));
        }
        return [$best * 0.7, 'Ownership: Partial ownership compatibility'];
    }

    // ─── Sub-Scorers (Financial) ────────────────────────────────────────

    private function scoreBudgetFit(Investor $investor, Target $target): array
    {
        $buyerBudget  = $this->toArray($investor->companyOverview?->investment_budget);
        $sellerAmount = $this->toArray($target->financialDetails?->expected_investment_amount);

        if (empty($buyerBudget) && empty($sellerAmount)) return [null, ''];
        if (empty($buyerBudget))  return [0.4, 'Budget: Investor has no budget set'];
        if (empty($sellerAmount)) return [0.4, 'Budget: Target has no investment amount set'];

        $budgetMin = (float) ($buyerBudget['min'] ?? $buyerBudget[0] ?? 0);
        $budgetMax = (float) ($buyerBudget['max'] ?? $buyerBudget[1] ?? PHP_FLOAT_MAX);
        $sellerMin = (float) ($sellerAmount['min'] ?? $sellerAmount[0] ?? 0);
        $sellerMax = (float) ($sellerAmount['max'] ?? $sellerAmount[1] ?? $sellerMin);

        if ($sellerMin >= $budgetMin && $sellerMax <= $budgetMax) {
            return [1.0, 'Budget: Deal size fits investor budget perfectly'];
        }
        if ($sellerMin <= $budgetMax && $sellerMax >= $budgetMin) {
            return [0.7, 'Budget: Partial budget overlap'];
        }

        $gap = min(abs($sellerMin - $budgetMax), abs($sellerMax - $budgetMin));
        $range = max($budgetMax - $budgetMin, 1);
        $proximity = max(0, 1 - ($gap / $range));
        return [$proximity * 0.5, 'Budget: Deal size near but outside investor budget'];
    }

    private function scoreEbitdaPresence(Target $target): array
    {
        $ebitda = $this->toArray($target->financialDetails?->ebitda_value);
        $ebitdaVal = (float) ($ebitda['min'] ?? $ebitda[0] ?? 0);

        if ($ebitdaVal <= 0) return [null, ''];

        // If EBITDA is present and positive, it's a quality signal
        return [0.8, "EBITDA: Target has EBITDA of {$ebitdaVal} on record"];
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

    private function extractBudgetMin(Investor $investor): float
    {
        $budget = $this->toArray($investor->companyOverview?->investment_budget);
        return (float) ($budget['min'] ?? $budget[0] ?? 0);
    }

    private function extractBudgetMax(Investor $investor): float
    {
        $budget = $this->toArray($investor->companyOverview?->investment_budget);
        return (float) ($budget['max'] ?? $budget[1] ?? PHP_FLOAT_MAX);
    }

    // ─── Ownership Helpers ──────────────────────────────────────────────

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
