<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Imports;

use App\Models\Seller;
use App\Models\SellersCompanyOverview;
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

class SellersCompanyOverviewSheetImport implements OnEachRow, WithHeadingRow, WithChunkReading, WithValidation, WithMapping
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
            if (is_null($value) || (!is_string($value) && !is_numeric($value))) return [];
            if (is_array($value)) return $value;
            if (trim((string)$value) === '') return [];
            $delimiters = [',', ';'];
            $escaped_delimiters = array_map(function($d) { return preg_quote($d, '/'); }, $delimiters);
            $pattern = '/' . implode('|', $escaped_delimiters) . '/';
            return array_map('trim', preg_split($pattern, (string)$value));
        };

        // 1. Company Name
        $companyRegName = $row['company_name'] ?? null;
        if (empty($companyRegName)) {
            Log::warning("Skipping row $rowIndex: Empty Company Name.");
            return;
        }

        // 2. Code Validation (XX-S-NNN)
        $projectCode = isset($row['project_id']) ? strtoupper(trim($row['project_id'])) : null;
        $countryName = $row['hq'] ?? null;
        if ($projectCode) {
            // Basic format check
            if (!preg_match('/^[A-Z]{2}-[BS]-\d{1,5}$/', $projectCode)) {
                Log::error("Validation Error Row $rowIndex: Invalid Project Code format '$projectCode'. Must be XX-S-NNN.");
                return;
            }

            // Type letter must be S for Seller/Target import
            $parts = explode('-', $projectCode);
            if ($parts[1] !== 'S') {
                Log::error("Validation Error Row $rowIndex: Project Code '$projectCode' uses type '{$parts[1]}' but must use 'S' for Target import.");
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
            if (Seller::where('seller_id', $projectCode)->exists()) {
                Log::error("Validation Error Row $rowIndex: Duplicate Project Code '$projectCode'.");
                return;
            }
        }

        // 3. Rank (Already validated by rules)
        $rank = strtoupper(trim($row['rank']));

        // 4. HQ Country (with alias support)
        if (!$countryName) $countryName = $row['hq'] ?? null;
        $lookupName = ImportValidationService::REGION_ALIASES[strtolower(trim($countryName ?? ''))] ?? trim($countryName ?? '');
        $country = Country::whereRaw('LOWER(name) = ?', [strtolower($lookupName)])->first();
        $hqCountryId = $country ? $country->id : null;
        if (!$hqCountryId) {
            Log::warning("Row $rowIndex: Country '$countryName' not found. Please fix in system.");
        }

        // 5. Industry & Niche
        $industries = $commaSeparatedToArray($row['target_industries'] ?? $row['target-industries'] ?? $row['targetindustries'] ?? $row['industry_major_classification'] ?? '');
        $nicheTags = $commaSeparatedToArray($row['niche_tags'] ?? $row['niche-tags'] ?? $row['nichetags'] ?? '');
        
        // 6. Internal PIC & Financial Advisor
        $internalPic = $commaSeparatedToArray($row['internal_pic'] ?? $row['internal-pic'] ?? $row['internalpic'] ?? '');
        $financialAdvisor = $commaSeparatedToArray($row['financial_advisor'] ?? $row['financial-advisor'] ?? $row['financialadvisor'] ?? '');
        
        // 7. Website Links & Teaser
        $websiteLinks = $this->parseJsonColumn($row['website_links'] ?? $row['website-links'] ?? $row['websitelinks'] ?? null) 
            ?? (($row['website_links'] ?? $row['website-links'] ?? $row['websitelinks'] ?? null) ? [$row['website_links'] ?? $row['website-links'] ?? $row['websitelinks']] : []);
        $website = $row['website'] ?? null; // Fallback or separate
        $teaserLink = $row['teaser_link'] ?? $row['teaser-link'] ?? $row['teaserlink'] ?? $row['teaser'] ?? null;
        
        // 8. Financials
        $desiredInvestmentCurrency = strtoupper(trim($row['desired_investment_currency'] ?? $row['desired-investment-currency'] ?? $row['desiredinvestmentcurrency'] ?? 'USD'));
        $desiredInvestmentMin = filter_var($row['desired_investment_min'] ?? $row['desired-investment-min'] ?? $row['desiredinvestmentmin'] ?? null, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        $desiredInvestmentMax = filter_var($row['desired_investment_max'] ?? $row['desired-investment-max'] ?? $row['desiredinvestmentmax'] ?? null, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        
        $ebitdaMin = filter_var($row['ebitda_min'] ?? $row['ebitda-min'] ?? $row['ebitdamin'] ?? null, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        $ebitdaMax = filter_var($row['ebitda_max'] ?? $row['ebitda-max'] ?? $row['ebitdamax'] ?? null, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        
        // Create Overview
        $overview = SellersCompanyOverview::create([
            'reg_name'            => $companyRegName,
            'hq_country'          => $hqCountryId,
            'company_type'        => 'Corporate',
            'industry_ops'        => $industries,
            'niche_industry'      => $nicheTags, 
            'company_rank'        => $rank,
            'reason_ma'           => $row['reason_for_ma'] ?? $row['purpose_of_mna'] ?? null, // reason_ma is VARCHAR — store as plain string
            'status'              => $row['status'] ?? 'Active',
            'details'             => $row['project_details'] ?? $row['project-details'] ?? $row['projectdetails'] ?? null,
            'website'             => $website,
            'website_links'       => $websiteLinks,
            'teaser_link'         => $teaserLink,
            'seller_contact_name' => $row['contact_person'] ?? null,
            'seller_designation'  => $row['position'] ?? null,
            'seller_email'        => $row['email'] ?? null,
            'internal_pic'        => $internalPic,
            'financial_advisor'   => $financialAdvisor,
        ]);

        // Create Financial Details for the ratio
        $financial = \App\Models\SellersFinancialDetail::create([
            'maximum_investor_shareholding_percentage' => $row['planned_sale_share_ratio'] ?? $row['planned-sale-share-ratio'] ?? $row['plannedsaleshareratio'] ?? $row['planned_ratio_sale'] ?? null,
            'expected_investment_amount' => [
                'min' => $desiredInvestmentMin,
                'max' => $desiredInvestmentMax,
                'currency' => $desiredInvestmentCurrency
            ],
            'ebitda_value' => [
                'min' => $ebitdaMin,
                'max' => $ebitdaMax,
                'currency' => $desiredInvestmentCurrency 
            ],
            'default_currency' => $desiredInvestmentCurrency,
        ]);

        // Create Parent Seller Record
        Seller::create([
            'seller_id' => $projectCode,
            'company_overview_id' => $overview->id,
            'financial_detail_id' => $financial->id,
            'status' => 'Active',
        ]);
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function rules(): array
    {
        return [
            'project_id'     => 'nullable|regex:/^[A-Z]{2}-S-\d{1,5}$/i|unique:sellers,seller_id',
            'rank'           => 'required|in:A,B,C,a,b,c',
            'company_name'   => 'required|string|max:255',
            'hq'             => 'required|exists:countries,name',
            'industry_major_classification' => 'nullable|string',
            'project_details' => 'nullable|string',
            'website_lp_url' => 'nullable|string',
            'purpose_of_mna' => 'nullable|string|in:Market Expansion,Succession/Exit,Strategic Partnership,Financial Restructuring,Other',
            'planned_ratio_sale' => 'nullable|string',
            'contact_person' => 'nullable|string',
            'position'       => 'nullable|string',
            'email'          => 'nullable|string',
            'teaser'         => 'nullable|string',
            'niche_tags'     => 'nullable',
            'desired_investment_min' => 'nullable',
            'desired_investment_max' => 'nullable',
            'desired_investment_currency' => 'nullable|string',
            'ebitda_min'     => 'nullable',
            'ebitda_max'     => 'nullable',
            'internal_pic'   => 'nullable',
            'financial_advisor' => 'nullable',
            'website_links'  => 'nullable',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'company_registered_name.required' => 'The "Company Registered Name" is required for each company.',
            'company_s_email.email' => 'The "Company\'s Email" is not a valid email address.',
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
            if (is_numeric($value) && $value > 25569 && $value < 60000) { // Basic check for Excel date numbers
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
}
