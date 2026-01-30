<?php

namespace App\Imports;

use App\Models\Seller;
use App\Models\SellersCompanyOverview;
use App\Models\Country;
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
            if (is_null($value) || trim($value) === '') return [];
            if (is_array($value)) return $value;
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

        // 2. Code Validation (Already validated by rules)
        $projectCode = isset($row['project_id']) ? strtoupper(trim($row['project_id'])) : null;

        // 3. Rank (Already validated by rules)
        $rank = strtoupper(trim($row['rank']));

        // 4. HQ Country (Already validated by rules)
        $countryName = $row['hq'];
        $country = Country::where('name', trim($countryName))->first();
        $hqCountryId = $country->id;

        // 5. Industry
        $industries = $commaSeparatedToArray($row['industry_major_classification'] ?? '');

        // Create Overview
        $overview = SellersCompanyOverview::create([
            'reg_name'            => $companyRegName,
            'hq_country'          => $hqCountryId,
            'company_type'        => 'Corporate',
            'industry_ops'        => $industries,
            'company_rank'        => $rank,
            'reason_ma'           => $row['purpose_of_mna'] ? [$row['purpose_of_mna']] : null,
            'status'              => 'Active',
            'details'             => $row['project_details'] ?? null,
            'website'             => $row['website_lp_url'] ?? null,
            'teaser_link'         => $row['teaser'] ?? null,
            'seller_contact_name' => $row['contact_person'] ?? null,
            'seller_designation'  => $row['position'] ?? null,
            'seller_email'        => $row['email'] ?? null,
        ]);

        // Create Financial Details for the ratio
        $financial = \App\Models\SellersFinancialDetail::create([
            'maximum_investor_shareholding_percentage' => $row['planned_ratio_sale'] ?? null,
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
