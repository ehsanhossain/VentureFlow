<?php

namespace App\Services;

use App\Models\Country;
use App\Models\Industry;
use App\Models\Currency;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImportValidationService
{
    // ── Predefined option lists (mirrors frontend constants) ──

    public const INVESTOR_MNA_PURPOSES = [
        'Strategic Expansion',
        'Market Entry',
        'Talent Acquisition',
        'Diversification',
        'Technology Acquisition',
        'Financial Investment',
        'Other',
    ];

    public const TARGET_REASONS_MA = [
        "Owner's Retirement",
        'Business Succession',
        'Full Exit',
        'Partial Exit',
        'Capital Raising',
        'Strategic Partnership',
        'Growth Acceleration',
        'Debt Restructuring',
        'Risk Mitigation',
        'Non-Core Divestment',
        'Market Expansion',
        'Technology Integration',
        'Cross-Border Expansion',
    ];

    public const INVESTMENT_CONDITIONS = [
        'Minority (<50%)',
        'Significant minority (25–49%)',
        'Joint control (51/49)',
        'Majority (51–99%)',
        'Full acquisition (100%)',
        'Flexible',
    ];

    public const CHANNELS = ['TCF', 'Partner', 'Website', 'Social Media'];

    public const RANKS = ['A', 'B', 'C'];

    public const STATUSES = ['Active', 'Draft'];

    // ── Cached reference data ──
    private ?array $countriesCache = null;
    private ?array $industriesCache = null;
    private ?array $currenciesCache = null;

    /**
     * Common aliases / abbreviations for region names.
     * Maps lowercase alias => official database name.
     */
    public const REGION_ALIASES = [
        // APAC / Asia Pacific
        'apac'           => 'East Asia',
        'asia pacific'   => 'East Asia',
        'asia-pacific'   => 'East Asia',
        'asiapacific'    => 'East Asia',
        'ap'             => 'East Asia',

        // Southeast Asia
        'sea'            => 'ASEAN',
        'southeast asia' => 'ASEAN',
        'south east asia'=> 'ASEAN',

        // Europe
        'eu'             => 'Europe',
        'emea'           => 'Europe',

        // Middle East + Africa
        'mena'           => 'Middle East',
        'me'             => 'Middle East',
        'mideast'        => 'Middle East',
        'mid east'       => 'Middle East',

        // Americas
        'americas'       => 'North America',
        'us'             => 'North America',
        'usa'            => 'North America',
        'united states'  => 'North America',
        'na'             => 'North America',
        'latam'          => 'South America',
        'latin america'  => 'South America',

        // Gulf
        'gulf'           => 'GCC',
        'gulf states'    => 'GCC',

        // Nordic
        'nordics'        => 'Nordic Countries',
        'nordic'         => 'Nordic Countries',
        'scandinavia'    => 'Nordic Countries',

        // Oceania
        'anz'            => 'Oceania',
        'australasia'    => 'Oceania',
        'australia & nz' => 'Oceania',

        // Broader
        'worldwide'      => 'Global',
        'international'  => 'Global',
        'all'            => 'Global',
    ];

    /**
     * Load and cache reference data from the database.
     * Regions appear first, then actual countries alphabetically.
     */
    private function loadCountries(): array
    {
        if ($this->countriesCache === null) {
            $this->countriesCache = Country::orderByDesc('is_region')
                ->orderBy('name')
                ->pluck('name', 'id')
                ->toArray();
        }
        return $this->countriesCache;
    }

    private function loadIndustries(): array
    {
        if ($this->industriesCache === null) {
            $this->industriesCache = Industry::where('status', 'active')
                ->pluck('name', 'id')
                ->toArray();
        }
        return $this->industriesCache;
    }

    private function loadCurrencies(): array
    {
        if ($this->currenciesCache === null) {
            $this->currenciesCache = Currency::pluck('currency_code')->toArray();
        }
        return $this->currenciesCache;
    }

    /**
     * Get all reference data for template generation.
     */
    public function getReferenceData(): array
    {
        return [
            'countries' => array_values($this->loadCountries()),
            'industries' => array_values($this->loadIndustries()),
            'currencies' => $this->loadCurrencies(),
            'ranks' => self::RANKS,
            'channels' => self::CHANNELS,
            'statuses' => self::STATUSES,
            'investor_mna_purposes' => self::INVESTOR_MNA_PURPOSES,
            'target_reasons_ma' => self::TARGET_REASONS_MA,
            'investment_conditions' => self::INVESTMENT_CONDITIONS,
        ];
    }

    /**
     * Investor template column definitions.
     */
    public function getInvestorColumns(): array
    {
        return [
            ['key' => 'project_code',        'label' => 'Project Code',        'required' => false, 'type' => 'text'],
            ['key' => 'rank',                 'label' => 'Rank',                'required' => true,  'type' => 'dropdown', 'options' => 'ranks'],
            ['key' => 'company_name',         'label' => 'Company Name',        'required' => true,  'type' => 'text'],
            ['key' => 'origin_country',       'label' => 'Origin Country',      'required' => true,  'type' => 'dropdown', 'options' => 'countries'],
            ['key' => 'website',              'label' => 'Website',             'required' => false, 'type' => 'text'],
            ['key' => 'hq_address',           'label' => 'HQ Address',          'required' => false, 'type' => 'text'],
            ['key' => 'company_industry',     'label' => 'Company Industry',    'required' => false, 'type' => 'comma_sep', 'match_against' => 'industries'],
            ['key' => 'target_industries',    'label' => 'Target Industries',   'required' => false, 'type' => 'comma_sep', 'match_against' => 'industries'],
            ['key' => 'target_countries',     'label' => 'Target Countries',    'required' => false, 'type' => 'comma_sep', 'match_against' => 'countries'],
            ['key' => 'purpose_mna',          'label' => 'Purpose of M&A',     'required' => false, 'type' => 'comma_sep', 'match_against' => 'investor_mna_purposes'],
            ['key' => 'budget_min',           'label' => 'Budget Min',          'required' => false, 'type' => 'number'],
            ['key' => 'budget_max',           'label' => 'Budget Max',          'required' => false, 'type' => 'number'],
            ['key' => 'budget_currency',      'label' => 'Budget Currency',     'required' => false, 'type' => 'dropdown', 'options' => 'currencies'],
            ['key' => 'investment_condition', 'label' => 'Investment Condition','required' => false, 'type' => 'comma_sep', 'match_against' => 'investment_conditions'],
            ['key' => 'project_details',      'label' => 'Project Details',     'required' => false, 'type' => 'text'],
            ['key' => 'channel',              'label' => 'Channel',             'required' => false, 'type' => 'dropdown', 'options' => 'channels'],
            ['key' => 'investor_profile_link','label' => 'Investor Profile Link','required' => false,'type' => 'text'],
            ['key' => 'internal_pic',         'label' => 'Internal PIC',        'required' => false, 'type' => 'comma_sep'],
            ['key' => 'financial_advisor',    'label' => 'Financial Advisor',   'required' => false, 'type' => 'comma_sep'],
            ['key' => 'contact_name',         'label' => 'Contact Name',        'required' => false, 'type' => 'text'],
            ['key' => 'contact_email',        'label' => 'Contact Email',       'required' => false, 'type' => 'text'],
            ['key' => 'contact_phone',        'label' => 'Contact Phone',       'required' => false, 'type' => 'text'],
            ['key' => 'contact_designation',  'label' => 'Contact Designation', 'required' => false, 'type' => 'text'],
        ];
    }

    /**
     * Target template column definitions.
     */
    public function getTargetColumns(): array
    {
        return [
            ['key' => 'project_code',            'label' => 'Project Code',            'required' => false, 'type' => 'text'],
            ['key' => 'rank',                     'label' => 'Rank',                    'required' => true,  'type' => 'dropdown', 'options' => 'ranks'],
            ['key' => 'company_name',             'label' => 'Company Name',            'required' => true,  'type' => 'text'],
            ['key' => 'origin_country',           'label' => 'Origin Country',          'required' => true,  'type' => 'dropdown', 'options' => 'countries'],
            ['key' => 'status',                   'label' => 'Status',                  'required' => false, 'type' => 'dropdown', 'options' => 'statuses'],
            ['key' => 'target_industries',        'label' => 'Target Industries',       'required' => false, 'type' => 'comma_sep', 'match_against' => 'industries'],
            ['key' => 'niche_tags',               'label' => 'Niche Tags',              'required' => false, 'type' => 'text'],
            ['key' => 'project_details',          'label' => 'Project Details',         'required' => false, 'type' => 'text'],
            ['key' => 'reason_for_ma',            'label' => 'Reason for M&A',          'required' => false, 'type' => 'comma_sep', 'match_against' => 'target_reasons_ma'],
            ['key' => 'desired_investment_min',   'label' => 'Desired Investment Min',  'required' => false, 'type' => 'number'],
            ['key' => 'desired_investment_max',   'label' => 'Desired Investment Max',  'required' => false, 'type' => 'number'],
            ['key' => 'investment_currency',      'label' => 'Investment Currency',     'required' => false, 'type' => 'dropdown', 'options' => 'currencies'],
            ['key' => 'investment_condition',     'label' => 'Investment Condition',    'required' => false, 'type' => 'comma_sep', 'match_against' => 'investment_conditions'],
            ['key' => 'ebitda_min',               'label' => 'EBITDA Min',              'required' => false, 'type' => 'number'],
            ['key' => 'ebitda_max',               'label' => 'EBITDA Max',              'required' => false, 'type' => 'number'],
            ['key' => 'ebitda_times',             'label' => 'EBITDA Times',            'required' => false, 'type' => 'text'],
            ['key' => 'ebitda_details',           'label' => 'EBITDA Details',          'required' => false, 'type' => 'text'],
            ['key' => 'channel',                  'label' => 'Channel',                 'required' => false, 'type' => 'dropdown', 'options' => 'channels'],
            ['key' => 'website',                  'label' => 'Website',                 'required' => false, 'type' => 'text'],
            ['key' => 'teaser_link',              'label' => 'Teaser Link',             'required' => false, 'type' => 'text'],
            ['key' => 'internal_pic',             'label' => 'Internal PIC',            'required' => false, 'type' => 'comma_sep'],
            ['key' => 'financial_advisor',        'label' => 'Financial Advisor',       'required' => false, 'type' => 'comma_sep'],
            ['key' => 'contact_name',             'label' => 'Contact Name',            'required' => false, 'type' => 'text'],
            ['key' => 'contact_email',            'label' => 'Contact Email',           'required' => false, 'type' => 'text'],
            ['key' => 'contact_phone',            'label' => 'Contact Phone',           'required' => false, 'type' => 'text'],
            ['key' => 'contact_designation',      'label' => 'Contact Designation',     'required' => false, 'type' => 'text'],
        ];
    }

    /**
     * Parse a comma-separated value into an array of trimmed strings.
     */
    public function parseCommaSeparated(?string $value): array
    {
        if (is_null($value) || trim($value) === '') return [];
        return array_values(array_filter(array_map('trim', preg_split('/[,;]/', $value))));
    }

    /**
     * Sanitize a single cell value (convert N/A, null, - etc. to null).
     */
    public function sanitizeValue($value): ?string
    {
        if (is_null($value)) return null;
        $trimmed = trim((string) $value);
        if (in_array(strtolower($trimmed), ['n/a', 'na', '-', 'null', 'undefined', ''])) {
            return null;
        }
        return $trimmed;
    }

    /**
     * Fuzzy match a value against a list of valid options.
     * Returns [matched_value, confidence] or [null, suggestions].
     */
    public function fuzzyMatch(string $input, array $validOptions): array
    {
        $input = trim($input);

        // Normalize dashes: en-dash (–), em-dash (—) → regular hyphen (-)
        $normInput = str_replace(['–', '—'], '-', $input);

        // Exact match (case-insensitive, dash-normalized)
        foreach ($validOptions as $option) {
            $normOption = str_replace(['–', '—'], '-', $option);
            if (strtolower($normOption) === strtolower($normInput)) {
                return ['matched' => $option, 'suggestions' => []];
            }
        }

        // Check region aliases (only when matching against countries)
        $alias = self::REGION_ALIASES[strtolower($input)] ?? null;
        if ($alias) {
            // Verify the alias target exists in valid options
            foreach ($validOptions as $option) {
                $normOption = str_replace(['–', '—'], '-', $option);
                if (strtolower($normOption) === strtolower(str_replace(['–', '—'], '-', $alias))) {
                    return ['matched' => $option, 'suggestions' => []];
                }
            }
        }

        // Partial / fuzzy match — find closest
        $bestMatch = null;
        $bestDistance = PHP_INT_MAX;
        $suggestions = [];

        foreach ($validOptions as $option) {
            $normOption = str_replace(['–', '—'], '-', $option);
            // Contains match (dash-normalized)
            if (str_contains(strtolower($normOption), strtolower($normInput)) ||
                str_contains(strtolower($normInput), strtolower($normOption))) {
                return ['matched' => $option, 'suggestions' => []];
            }

            $dist = levenshtein(strtolower($normInput), strtolower($normOption));
            if ($dist < $bestDistance) {
                $bestDistance = $dist;
                $bestMatch = $option;
            }
        }

        // If very close (threshold: 3 chars distance), suggest
        $threshold = max(3, (int)(strlen($normInput) * 0.4));
        if ($bestDistance <= $threshold) {
            $suggestions = [$bestMatch];
        }

        // Build top-3 suggestions
        $scored = [];
        foreach ($validOptions as $option) {
            $normOption = str_replace(['–', '—'], '-', $option);
            $scored[] = [
                'option' => $option,
                'distance' => levenshtein(strtolower($normInput), strtolower($normOption)),
            ];
        }
        usort($scored, fn($a, $b) => $a['distance'] <=> $b['distance']);
        $suggestions = array_slice(array_column(array_slice($scored, 0, 3), 'option'), 0, 3);

        return ['matched' => null, 'suggestions' => $suggestions];
    }

    /**
     * Validate a single row of data.
     * Returns ['data' => [...], 'errors' => [...], 'status' => 'valid'|'error'|'warning']
     */
    public function validateRow(array $row, string $type, int $rowIndex): array
    {
        $columns = $type === 'investor' ? $this->getInvestorColumns() : $this->getTargetColumns();
        $refData = $this->getReferenceData();

        $validatedData = [];
        $errors = [];

        foreach ($columns as $col) {
            $key = $col['key'];
            $rawValue = $this->sanitizeValue($row[$key] ?? null);
            $validatedData[$key] = $rawValue;

            // Required field check
            if ($col['required'] && (is_null($rawValue) || $rawValue === '')) {
                $errors[] = [
                    'field' => $key,
                    'label' => $col['label'],
                    'value' => $rawValue,
                    'message' => "{$col['label']} is required",
                    'suggestions' => [],
                ];
                continue;
            }

            if (is_null($rawValue) || $rawValue === '') continue;

            // Type-specific validation
            switch ($col['type']) {
                case 'dropdown':
                    $optionKey = $col['options'];
                    $validOptions = $refData[$optionKey] ?? [];
                    $result = $this->fuzzyMatch($rawValue, $validOptions);
                    if ($result['matched']) {
                        $validatedData[$key] = $result['matched'];
                    } else {
                        $errors[] = [
                            'field' => $key,
                            'label' => $col['label'],
                            'value' => $rawValue,
                            'message' => "'{$rawValue}' not found in system",
                            'suggestions' => $result['suggestions'],
                        ];
                    }
                    break;

                case 'comma_sep':
                    $items = $this->parseCommaSeparated($rawValue);
                    $matchAgainst = $col['match_against'] ?? null;
                    // Industry fields are flexible: unrecognized names pass through
                    // and will be auto-created as ad-hoc industries during import
                    $isFlexible = in_array($key, ['company_industry', 'target_industries']);

                    if ($matchAgainst) {
                        $validOptions = $refData[$matchAgainst] ?? [];
                        $validItems = [];
                        $invalidItems = [];

                        foreach ($items as $item) {
                            $result = $this->fuzzyMatch($item, $validOptions);
                            if ($result['matched']) {
                                $validItems[] = $result['matched'];
                            } else {
                                if ($isFlexible) {
                                    // For industries: keep unrecognized names as-is (ad-hoc)
                                    $validItems[] = trim($item);
                                } else {
                                    $invalidItems[] = [
                                        'value' => $item,
                                        'suggestions' => $result['suggestions'],
                                    ];
                                }
                            }
                        }

                        $validatedData[$key] = implode(', ', $validItems);

                        if (!empty($invalidItems)) {
                            $invalidNames = array_column($invalidItems, 'value');
                            $allSuggestions = [];
                            foreach ($invalidItems as $inv) {
                                $allSuggestions = array_merge($allSuggestions, $inv['suggestions']);
                            }
                            $errors[] = [
                                'field' => $key,
                                'label' => $col['label'],
                                'value' => implode(', ', $invalidNames),
                                'message' => "Unrecognized: " . implode(', ', $invalidNames),
                                'suggestions' => array_unique($allSuggestions),
                            ];
                        }
                    }
                    // For comma_sep without match_against (like internal_pic), just pass through
                    break;

                case 'number':
                    $numericValue = filter_var($rawValue, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
                    if ($numericValue === false || $numericValue === '') {
                        $errors[] = [
                            'field' => $key,
                            'label' => $col['label'],
                            'value' => $rawValue,
                            'message' => "'{$rawValue}' is not a valid number",
                            'suggestions' => [],
                        ];
                    } else {
                        $validatedData[$key] = $numericValue;
                    }
                    break;

                case 'text':
                default:
                    // No validation needed for free text
                    break;
            }
        }

        // ═══ Project Code Validation ═══
        $projectCode = $validatedData['project_code'] ?? null;
        if ($projectCode) {
            $projectCode = strtoupper(trim($projectCode));
            $validatedData['project_code'] = $projectCode;
            $prefix = $type === 'investor' ? 'B' : 'S';
            $typeLabel = $type === 'investor' ? 'Investor (B = Buyer)' : 'Target (S = Seller)';

            // 1. Basic format check: XX-B-NNN or XX-S-NNN
            $pattern = '/^[A-Z]{2}-[BS]-\d{1,5}$/';
            if (!preg_match($pattern, $projectCode)) {
                $errors[] = [
                    'field' => 'project_code',
                    'label' => 'Project Code',
                    'value' => $projectCode,
                    'message' => "Invalid format. Expected: XX-{$prefix}-NNN (e.g., JP-{$prefix}-001).",
                    'suggestions' => [],
                ];
            } else {
                // Parse the parts: [ALPHA_2]-[TYPE]-[NUMBER]
                $parts = explode('-', $projectCode);
                $codeAlpha2 = $parts[0];    // e.g., "JP"
                $codeType = $parts[1];       // e.g., "B" or "S"

                // 2. Type letter must match the import type
                if ($codeType !== $prefix) {
                    $wrongType = $codeType === 'B' ? 'Investor (Buyer)' : 'Target (Seller)';
                    $errors[] = [
                        'field' => 'project_code',
                        'label' => 'Project Code',
                        'value' => $projectCode,
                        'message' => "Type mismatch: '{$codeType}' is for {$wrongType}, but you are importing {$typeLabel}. The code must use '{$prefix}' (e.g., {$codeAlpha2}-{$prefix}-{$parts[2]}).",
                        'suggestions' => ["{$codeAlpha2}-{$prefix}-{$parts[2]}"],
                    ];
                }

                // 3. Alpha-2 code must match origin country
                $originCountryName = $validatedData['origin_country'] ?? null;
                if ($originCountryName) {
                    // Resolve the origin country's alpha_2_code from DB
                    $originCountry = Country::whereRaw('LOWER(name) = ?', [strtolower($originCountryName)])->first();

                    if ($originCountry && $originCountry->alpha_2_code) {
                        $expectedAlpha2 = strtoupper($originCountry->alpha_2_code);
                        if ($codeAlpha2 !== $expectedAlpha2) {
                            // Find which country the code's alpha-2 actually belongs to
                            $codeCountry = Country::where('alpha_2_code', $codeAlpha2)->first();
                            $codeCountryName = $codeCountry ? $codeCountry->name : 'unknown country';

                            $errors[] = [
                                'field' => 'project_code',
                                'label' => 'Project Code',
                                'value' => $projectCode,
                                'message' => "Country code mismatch: '{$codeAlpha2}' refers to {$codeCountryName}, but Origin Country is '{$originCountryName}' ({$expectedAlpha2}). The code should start with '{$expectedAlpha2}' (e.g., {$expectedAlpha2}-{$prefix}-{$parts[2]}).",
                                'suggestions' => ["{$expectedAlpha2}-{$prefix}-{$parts[2]}"],
                            ];
                        }
                    } elseif ($originCountry && $originCountry->is_region) {
                        // Regions don't have alpha_2_code — warn but don't error
                        // Regions like "Global", "ASEAN" etc. can use any alpha code
                    }
                }

                // 4. Check for duplicate project code in database
                if ($type === 'investor') {
                    $exists = \App\Models\Buyer::where('buyer_id', $projectCode)->exists();
                } else {
                    $exists = \App\Models\Seller::where('seller_id', $projectCode)->exists();
                }

                if ($exists) {
                    $errors[] = [
                        'field' => 'project_code',
                        'label' => 'Project Code',
                        'value' => $projectCode,
                        'message' => "Duplicate: Project code '{$projectCode}' already exists in the system. Please use a different number.",
                        'suggestions' => [],
                    ];
                }
            }
        }

        return [
            'rowIndex' => $rowIndex,
            'status' => empty($errors) ? 'valid' : 'error',
            'data' => $validatedData,
            'errors' => $errors,
        ];
    }

    /**
     * Validate all rows from a parsed file.
     */
    public function validateAllRows(array $rows, string $type): array
    {
        $results = [];
        $validCount = 0;
        $errorCount = 0;

        foreach ($rows as $index => $row) {
            $result = $this->validateRow($row, $type, $index + 2); // +2 because row 1 is headers

            if ($result['status'] === 'valid') {
                $validCount++;
            } else {
                $errorCount++;
            }

            $results[] = $result;
        }

        // ── Intra-file duplicate project code check ──
        $codeIndex = []; // project_code => [list of result indices]
        foreach ($results as $idx => $result) {
            $code = $result['data']['project_code'] ?? null;
            if ($code) {
                $codeIndex[strtoupper($code)][] = $idx;
            }
        }

        foreach ($codeIndex as $code => $indices) {
            if (count($indices) > 1) {
                $rowNumbers = array_map(fn($i) => $results[$i]['rowIndex'], $indices);
                foreach ($indices as $i) {
                    // Only add the error if the row doesn't already have this error
                    $alreadyHasDupError = false;
                    foreach ($results[$i]['errors'] as $err) {
                        if ($err['field'] === 'project_code' && str_contains($err['message'], 'Duplicate in file')) {
                            $alreadyHasDupError = true;
                            break;
                        }
                    }
                    if (!$alreadyHasDupError) {
                        $otherRows = array_filter($rowNumbers, fn($r) => $r !== $results[$i]['rowIndex']);
                        $results[$i]['errors'][] = [
                            'field' => 'project_code',
                            'label' => 'Project Code',
                            'value' => $code,
                            'message' => "Duplicate in file: Project code '{$code}' also appears in row(s) " . implode(', ', $otherRows) . ". Each project code must be unique.",
                            'suggestions' => [],
                        ];
                        if ($results[$i]['status'] === 'valid') {
                            $results[$i]['status'] = 'error';
                            $validCount--;
                            $errorCount++;
                        }
                    }
                }
            }
        }

        return [
            'summary' => [
                'total' => count($rows),
                'valid' => $validCount,
                'errors' => $errorCount,
            ],
            'rows' => $results,
            'columns' => $type === 'investor' ? $this->getInvestorColumns() : $this->getTargetColumns(),
        ];
    }

    /**
     * Resolve a country name to its database ID.
     */
    public function resolveCountryId(string $name): ?int
    {
        $countries = $this->loadCountries();
        $trimmedName = strtolower(trim($name));

        // Direct name match
        foreach ($countries as $id => $countryName) {
            if (strtolower($countryName) === $trimmedName) {
                return $id;
            }
        }

        // Check aliases
        $alias = self::REGION_ALIASES[$trimmedName] ?? null;
        if ($alias) {
            foreach ($countries as $id => $countryName) {
                if (strtolower($countryName) === strtolower($alias)) {
                    return $id;
                }
            }
        }

        return null;
    }

    /**
     * Resolve an industry name to its database ID.
     */
    public function resolveIndustryId(string $name): ?int
    {
        $industries = $this->loadIndustries();
        foreach ($industries as $id => $industryName) {
            if (strtolower($industryName) === strtolower(trim($name))) {
                return $id;
            }
        }
        return null;
    }
}
