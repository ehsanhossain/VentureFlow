<?php

namespace App\Services;

use App\Models\Industry;
use Illuminate\Support\Collection;

/**
 * Smart Industry Similarity Service
 *
 * Compares ad-hoc industry names against primary (database) industries
 * using a weighted combination of four matching strategies:
 *
 *   1. Levenshtein Distance  (30%) — catches typos
 *   2. Token Overlap / Jaccard (35%) — catches reordered words
 *   3. Substring Containment  (20%) — catches partial matches
 *   4. Phonetic (Metaphone)   (15%) — catches sound-alike misspellings
 *
 * Returns ranked suggestions with a confidence score (0–100).
 */
class IndustrySimilarityService
{
    // Weights for each strategy (must sum to 1.0)
    private const W_LEVENSHTEIN = 0.30;
    private const W_TOKEN       = 0.35;
    private const W_SUBSTRING   = 0.20;
    private const W_PHONETIC    = 0.15;

    // Minimum score (0–100) to include in suggestions
    private const MIN_SCORE     = 40;

    // Maximum number of suggestions per ad-hoc industry
    private const MAX_SUGGESTIONS = 3;

    // Common noise words to strip before comparison
    private const NOISE_WORDS = ['and', '&', 'the', 'of', 'for', 'in', 'on', 'at', 'to', 'a', 'an'];

    /**
     * Given an ad-hoc industry name, return the top matching primary industries
     * with confidence scores.
     *
     * @param  string              $adhocName         The user-typed industry name
     * @param  Collection|null     $primaryIndustries Preloaded collection (optional, fetched if null)
     * @return array  Each element: ['id' => int, 'name' => string, 'score' => int]
     */
    public function suggest(string $adhocName, ?Collection $primaryIndustries = null): array
    {
        if (empty(trim($adhocName))) {
            return [];
        }

        $primaryIndustries = $primaryIndustries ?? Industry::where('status', 1)->get();

        if ($primaryIndustries->isEmpty()) {
            return [];
        }

        $normalizedAdhoc = $this->normalize($adhocName);
        $adhocTokens     = $this->tokenize($adhocName);
        $adhocPhonetics  = $this->phoneticTokens($adhocTokens);

        $results = [];

        foreach ($primaryIndustries as $primary) {
            $normalizedPrimary = $this->normalize($primary->name);
            $primaryTokens     = $this->tokenize($primary->name);
            $primaryPhonetics  = $this->phoneticTokens($primaryTokens);

            // Skip exact matches (they don't need suggestions)
            if ($normalizedAdhoc === $normalizedPrimary) {
                return [['id' => $primary->id, 'name' => $primary->name, 'score' => 100]];
            }

            // Strategy 1: Levenshtein
            $levScore = $this->levenshteinScore($normalizedAdhoc, $normalizedPrimary);

            // Strategy 2: Token Overlap (Jaccard)
            $tokenScore = $this->tokenOverlapScore($adhocTokens, $primaryTokens);

            // Strategy 3: Substring containment
            $substringScore = $this->substringScore($normalizedAdhoc, $normalizedPrimary);

            // Strategy 4: Phonetic matching
            $phoneticScore = $this->phoneticScore($adhocPhonetics, $primaryPhonetics);

            // Weighted combination
            $combinedScore = (int) round(
                ($levScore       * self::W_LEVENSHTEIN +
                 $tokenScore     * self::W_TOKEN +
                 $substringScore * self::W_SUBSTRING +
                 $phoneticScore  * self::W_PHONETIC) * 100
            );

            if ($combinedScore >= self::MIN_SCORE) {
                $results[] = [
                    'id'    => $primary->id,
                    'name'  => $primary->name,
                    'score' => $combinedScore,
                ];
            }
        }

        // Sort by score descending, take top N
        usort($results, fn($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($results, 0, self::MAX_SUGGESTIONS);
    }

    /**
     * Process multiple ad-hoc names at once and return suggestions for each.
     *
     * @param  array $adhocNames  Array of ad-hoc industry names
     * @return array  Keyed by adhoc name => suggestions array
     */
    public function suggestBatch(array $adhocNames): array
    {
        $primaryIndustries = Industry::where('status', 1)->get();
        $results = [];

        foreach ($adhocNames as $name) {
            $results[$name] = $this->suggest($name, $primaryIndustries);
        }

        return $results;
    }

    // ─── Scoring Strategies ──────────────────────────────────────────────

    /**
     * Strategy 1: Levenshtein Distance (normalized 0–1)
     * Lower distance = higher score.
     */
    private function levenshteinScore(string $a, string $b): float
    {
        $maxLen = max(strlen($a), strlen($b));
        if ($maxLen === 0) return 1.0;

        $distance = levenshtein($a, $b);
        return 1.0 - ($distance / $maxLen);
    }

    /**
     * Strategy 2: Token Overlap (Jaccard Similarity)
     * Compares sets of meaningful words.
     * "Logistics & Transportation" vs "Transportation Logistics" → 1.0
     */
    private function tokenOverlapScore(array $tokensA, array $tokensB): float
    {
        if (empty($tokensA) && empty($tokensB)) return 1.0;
        if (empty($tokensA) || empty($tokensB)) return 0.0;

        $setA = array_unique($tokensA);
        $setB = array_unique($tokensB);

        $intersection = count(array_intersect($setA, $setB));
        $union = count(array_unique(array_merge($setA, $setB)));

        return $union > 0 ? $intersection / $union : 0.0;
    }

    /**
     * Strategy 3: Substring Containment
     * Checks if one string is contained in the other.
     * "Logistics" within "Logistics & Transportation" → high score.
     */
    private function substringScore(string $a, string $b): float
    {
        $shorter = strlen($a) <= strlen($b) ? $a : $b;
        $longer  = strlen($a) > strlen($b) ? $a : $b;

        if (empty($shorter) || empty($longer)) return 0.0;

        // Full containment
        if (str_contains($longer, $shorter)) {
            return strlen($shorter) / strlen($longer);
        }

        // Check if each token of the shorter exists in the longer
        $shortTokens = explode(' ', $shorter);
        $matchedTokens = 0;
        foreach ($shortTokens as $token) {
            if (strlen($token) >= 3 && str_contains($longer, $token)) {
                $matchedTokens++;
            }
        }

        return count($shortTokens) > 0
            ? ($matchedTokens / count($shortTokens)) * 0.8  // 80% max for partial token containment
            : 0.0;
    }

    /**
     * Strategy 4: Phonetic Matching (Metaphone)
     * Catches sound-alike mistakes: "logstick" → "logistics"
     */
    private function phoneticScore(array $phoneticsA, array $phoneticsB): float
    {
        if (empty($phoneticsA) && empty($phoneticsB)) return 1.0;
        if (empty($phoneticsA) || empty($phoneticsB)) return 0.0;

        $setA = array_unique($phoneticsA);
        $setB = array_unique($phoneticsB);

        $intersection = count(array_intersect($setA, $setB));
        $union = count(array_unique(array_merge($setA, $setB)));

        return $union > 0 ? $intersection / $union : 0.0;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    /**
     * Normalize a string for comparison: lowercase, strip special chars.
     */
    private function normalize(string $text): string
    {
        $text = mb_strtolower(trim($text));
        // Replace & with 'and', remove other special chars
        $text = str_replace('&', 'and', $text);
        $text = preg_replace('/[^a-z0-9\s]/', '', $text);
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    /**
     * Tokenize a string into meaningful words, removing noise words.
     */
    private function tokenize(string $text): array
    {
        $normalized = $this->normalize($text);
        $words = explode(' ', $normalized);

        return array_values(
            array_filter($words, fn($w) => strlen($w) >= 2 && !in_array($w, self::NOISE_WORDS))
        );
    }

    /**
     * Generate metaphone codes for each token.
     */
    private function phoneticTokens(array $tokens): array
    {
        return array_values(
            array_filter(
                array_map(fn($t) => metaphone($t), $tokens),
                fn($v) => !empty($v)
            )
        );
    }
}
