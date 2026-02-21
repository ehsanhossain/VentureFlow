<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Imports;

use App\Models\Buyer;
use App\Models\BuyersCompanyOverview;
use App\Models\Country;
use App\Services\ImportValidationService;
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Row;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\WithMapping;

class BuyersCompanyOverviewSheetImport implements OnEachRow, WithHeadingRow, WithChunkReading, WithValidation, WithMapping
{
    private function parseJsonColumn($value): ?array
    {
        if (is_null($value)) {
            return null;
        }

        $trimmedValue = trim((string)$value);

        if ($trimmedValue === '') {
            return null;
        }

        // Prevent decoding the literal string "undefined" or "null" as a string
        if (strtolower($trimmedValue) === 'undefined' || strtolower($trimmedValue) === 'null') {
            Log::warning('Attempted to parse reserved keyword as JSON. Returning null.', ['value' => $value]);
            return null;
        }

        if (is_array($value)) { // If it's already an array (e.g. from WithCalculatedFormulas)
            return $value;
        }

        $decoded = json_decode($trimmedValue, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        Log::warning('Column value was not valid JSON. Returning null.', [
            'value' => $value,
            'json_error' => json_last_error_msg()
        ]);
        return null;
    }

    /**
    * Sanitize row data before validation.
    * Converts "N/A", "null", "-", etc. to actual null values.
    */
    public function map($row): array
    {
        $sanitized = [];
        foreach ($row as $key => $value) {
            if (is_string($value)) {
                $trimmed = trim($value);
                // Check for common bad values
                if (in_array(strtolower($trimmed), ['n/a', 'na', 'n\a', 'n/a', '-', 'null', 'undefined', ''])) {
                    $sanitized[$key] = null;
                } else {
                    $sanitized[$key] = $trimmed;
                }
            } else {
                $sanitized[$key] = $value;
            }
        }
        return $sanitized;
    }

    public function onRow(Row $row)
    {
        $rowIndex = $row->getIndex();
        $row = $row->toArray();

        $commaSeparatedToArray = function ($value) {
            if (is_null($value) || trim($value) === '') return [];
            if (is_array($value)) return $value;
            // Support both comma and semicolon
            $delimiters = [',', ';'];
            $escaped_delimiters = array_map(function($d) { return preg_quote($d, '/'); }, $delimiters);
            $pattern = '/' . implode('|', $escaped_delimiters) . '/';
            return array_map('trim', preg_split($pattern, (string)$value));
        };

        // 1. Company Name (Required)
        $companyRegName = $row['company_name'] ?? $row['company-name'] ?? $row['companyname'] ?? null;
        if (empty($companyRegName)) {
            Log::warning("Skipping row $rowIndex: Empty Company Name.");
            return;
        }

        // 2. Code Validation (XX-B-NNN)
        $projectCode = $row['project_code'] ?? $row['project-code'] ?? $row['projectcode'] ?? $row['code'] ?? null;
        if ($projectCode) {
            $projectCode = strtoupper(trim($projectCode));

            // Basic format check
            if (!preg_match('/^[A-Z]{2}-[BS]-\d{1,5}$/', $projectCode)) {
                Log::error("Validation Error Row $rowIndex: Invalid Project Code format '$projectCode'. Must be XX-B-NNN.");
                return;
            }

            // Type letter must be B for Buyer/Investor import
            $parts = explode('-', $projectCode);
            if ($parts[1] !== 'B') {
                Log::error("Validation Error Row $rowIndex: Project Code '$projectCode' uses type '{$parts[1]}' but must use 'B' for Investor import.");
                return;
            }

            // Alpha-2 code must match origin country
            if ($countryName) {
                $lookupName = ImportValidationService::REGION_ALIASES[strtolower(trim($countryName))] ?? trim($countryName);
                $originCountry = Country::whereRaw('LOWER(name) = ?', [strtolower($lookupName)])->first();
                if ($originCountry && $originCountry->alpha_2_code) {
                    $expectedAlpha2 = strtoupper($originCountry->alpha_2_code);
                    if ($parts[0] !== $expectedAlpha2) {
                        Log::error("Validation Error Row $rowIndex: Project Code '$projectCode' starts with '{$parts[0]}' but Origin Country '$countryName' has code '$expectedAlpha2'.");
                        return;
                    }
                }
            }

            // Check Duplicates
            if (Buyer::where('buyer_id', $projectCode)->exists()) {
                Log::error("Validation Error Row $rowIndex: Duplicate Project Code '$projectCode'.");
                return;
            }
        }

        // 3. Rank Handling (A, B, C)
        $rank = strtoupper(trim($row['rank'] ?? 'B'));
        if (!in_array($rank, ['A', 'B', 'C'])) {
            $rank = 'B'; // Default
        }

        // 4. Origin Country Lookup (with alias support)
        $countryName = $row['origin_country'] ?? $row['origin-country'] ?? $row['origincountry'] ?? $row['hq_country'] ?? null;
        $hqCountryId = null;
        if ($countryName) {
            $lookupName = ImportValidationService::REGION_ALIASES[strtolower(trim($countryName))] ?? trim($countryName);
            $country = Country::whereRaw('LOWER(name) = ?', [strtolower($lookupName)])->first();
            if ($country) {
                $hqCountryId = $country->id;
            } else {
                Log::warning("Row $rowIndex: Country '$countryName' not found. Please fix in system.");
            }
        }

        // 5. Target Countries & Industries
        $targetCountriesRaw = $commaSeparatedToArray($row['target_countries'] ?? $row['target-countries'] ?? $row['targetcountries'] ?? '');
        $targetCountries = $this->resolveCountryNames($targetCountriesRaw);
        $targetIndustries = $commaSeparatedToArray($row['target_industries'] ?? $row['target-industries'] ?? $row['targetindustries'] ?? '');
        $internalPic = $commaSeparatedToArray($row['internal_pic'] ?? $row['internal-pic'] ?? $row['internalpic'] ?? '');
        $financialAdvisor = $commaSeparatedToArray($row['financial_advisor'] ?? $row['financial-advisor'] ?? $row['financialadvisor'] ?? '');

        // 6. Budget (Min, Max, Currency)
        $budgetMin = filter_var($row['budget_min'] ?? $row['budget-min'] ?? $row['budgetmin'] ?? null, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        $budgetMax = filter_var($row['budget_max'] ?? $row['budget-max'] ?? $row['budgetmax'] ?? null, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        $budgetCurrency = strtoupper(trim($row['budget_currency'] ?? $row['budget-currency'] ?? $row['budgetcurrency'] ?? $row['default_currency'] ?? 'USD'));

        // 7. Purpose of M&A
        $purpose = $row['purpose_mna'] ?? $row['purpose-mna'] ?? $row['purposemna'] ?? $row['purpose_of_mna'] ?? null;
        
        // 8. Addresses & Website
        $hqAddressesStr = $row['hq_addresses'] ?? $row['hq-addresses'] ?? $row['hqaddresses'] ?? null;
        $hqAddresses = $this->parseJsonColumn($hqAddressesStr) ?? ($hqAddressesStr ? [$hqAddressesStr] : []); 
        $website = $row['website_links'] ?? $row['website-links'] ?? $row['websitelinks'] ?? $row['website'] ?? null;
        $profileLink = $row['investor_profile_link'] ?? $row['investor-profile-link'] ?? $row['investorprofilelink'] ?? $row['investor_profile'] ?? null;

        // 9. Contacts
        $contacts = $this->parseJsonColumn($row['contacts'] ?? null);
        if (!$contacts && isset($row['contact_person'])) {
             $contacts = [
                [
                    'name' => $row['contact_person'] ?? '',
                    'designation' => $row['position'] ?? '',
                    'email' => $row['email'] ?? '',
                    'isPrimary' => true
                ]
            ];
        }

        // Create Company Overview
        $overview = BuyersCompanyOverview::create([
            'reg_name'             => $companyRegName,
            'hq_country'           => $hqCountryId,
            'company_type'         => $row['company_type'] ?? 'Corporate',
            'year_founded'         => $row['year_founded'] ?? null,
            'rank'                 => $rank,
            'reason_ma'            => $purpose,
            'status'               => 'Active',
            'email'                => $row['email'] ?? null,
            'phone'                => $row['phone'] ?? null,
            'website'              => $website,
            'hq_address'           => $hqAddresses,
            'internal_pic'         => $internalPic,
            'financial_advisor'    => $financialAdvisor,
            'investment_condition' => $row['investment_condition'] ?? null,
            'investor_profile_link'=> $profileLink,
            'investment_budget'    => [
                'min' => $budgetMin,
                'max' => $budgetMax,
                'currency' => $budgetCurrency
            ],
            'target_countries'     => $targetCountries,
            'main_industry_operations' => $targetIndustries,
            'contacts'             => $contacts,
        ]);

        // Create Parent Buyer Record
        Buyer::create([
            'buyer_id' => $projectCode,
            'company_overview_id' => $overview->id,
            'status' => 'Active'
        ]);
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function rules(): array
    {
        return [
            'code'                => 'nullable|string',
            'rank'                => 'nullable|string|max:1',
            'company_name'        => 'nullable|string|max:255',
            'hq'                  => 'nullable|string',
            'target_countries'    => 'nullable|string',
            'target_industries'   => 'nullable|string',
            'budget_min'          => 'nullable',
            'budget_max'          => 'nullable',
            'budget_currency'     => 'nullable|string|max:10',
            'website_lp_url'      => 'nullable|string',
            'purpose_of_mna'      => 'nullable|string',
            'investment_condition'=> 'nullable|string',
            'contact_person'      => 'nullable|string',
            'position'            => 'nullable|string',
            'email'               => 'nullable|string',
            'investor_profile'    => 'nullable|string',
            'hq_addresses'        => 'nullable',
            'internal_pic'        => 'nullable',
            'financial_advisor'   => 'nullable',
            'website_links'       => 'nullable',
            'contacts'            => 'nullable',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'company_registered_name.required' => 'The "Company Registered Name" is required for each company.',
            'company_s_email.email' => 'The "Company’s Email" is not a valid email address.',
            'email_address.email' => 'The seller "Email Address" is not a valid email address.',
            'year_founded.digits' => 'The "Year Founded" must be a 4-digit year.',
            'website_link.url' => 'The "Website Link" must be a valid URL.',
        ];
    }

    private function transformDate($value): ?string
    {
        if (empty($value)) {
            return null;
        }
        try {
            if (is_numeric($value) && $value > 25569 && $value < 60000) { 
                return ExcelDate::excelToDateTimeObject($value)->format('Y-m-d');
            }
            return Carbon::parse((string) $value)->format('Y-m-d');
        } catch (\Exception $e) {
            Log::warning("Failed to parse date: " . $value . " - " . $e->getMessage());
            return null;
        }
    }

    private function parseAddress($value): array 
    {
        if (is_null($value) || trim((string)$value) === '') {
            return []; 
        }

        $trimmedValue = trim((string)$value);
        if (strtolower($trimmedValue) === 'undefined' || strtolower($trimmedValue) === 'null') {
             Log::warning('Attempted to parse reserved keyword as JSON for hq_address. Returning empty array.', ['value' => $value]);
            return [];
        }

        if (is_array($value)) {
            return $value;
        }

        $decoded = json_decode($trimmedValue, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        Log::warning('HQ Address was not valid JSON. Storing as string in fallback structure.', ['value' => $value]);
        return ['full_address_string' => $trimmedValue];
    }

    /**
     * Resolve an array of country/region name strings to country objects.
     * Supports aliases like 'APAC', 'SEA', 'MENA', etc.
     */
    private function resolveCountryNames(array $names): array
    {
        $resolved = [];
        $aliases = ImportValidationService::REGION_ALIASES;

        foreach ($names as $name) {
            $name = trim($name);
            if (empty($name)) continue;

            // Check alias first
            $lookupName = $aliases[strtolower($name)] ?? $name;

            $country = Country::whereRaw('LOWER(name) = ?', [strtolower($lookupName)])->first();

            if ($country) {
                $resolved[] = [
                    'id' => $country->id,
                    'name' => $country->name,
                ];
            } else {
                // Store as-is with a warning
                Log::warning("Country/region '{$name}' not found in database. Storing as text.");
                $resolved[] = [
                    'id' => null,
                    'name' => $name,
                ];
            }
        }

        return $resolved;
    }
}
