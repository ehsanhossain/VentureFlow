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
        $companyRegName = $row['company_name'] ?? $row['company_registered_name'] ?? null;
        if (empty($companyRegName)) {
            Log::warning("Skipping row $rowIndex: Empty Company Name.");
            return;
        }

        // 2. Code Validation (XX-S-XXX)
        $projectCode = $row['code'] ?? $row['project_code'] ?? null;
        if ($projectCode) {
            if (!preg_match('/^[A-Z]{2}-S-\d{2,3}$/', strtoupper($projectCode))) {
                Log::error("Validation Error Row $rowIndex: Invalid Project Code format '$projectCode'. Must be XX-S-XXX.");
                return;
            }
            if (Seller::where('seller_id', $projectCode)->exists()) {
                Log::error("Validation Error Row $rowIndex: Duplicate Project Code '$projectCode'.");
                return;
            }
        }

        // 3. Rank
        $rank = strtoupper(trim($row['rank'] ?? 'B'));
        if (!in_array($rank, ['A', 'B', 'C'])) {
            $rank = 'B';
        }

        // 4. HQ Country
        $countryName = $row['hq'] ?? $row['hq_country'] ?? $row['hq_origin_country'] ?? null;
        $hqCountryId = null;
        if ($countryName) {
            $country = Country::where('name', 'LIKE', trim($countryName))->first();
            if ($country) {
                $hqCountryId = $country->id;
            } else {
                Log::warning("Row $rowIndex: Country '$countryName' not found.");
            }
        }

        // 5. Industry
        $industries = $commaSeparatedToArray($row['industry'] ?? '');

        // 6. Budget
        $budgetMin = filter_var($row['budget_min'] ?? null, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        $budgetMax = filter_var($row['budget_max'] ?? null, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        $budgetCurrency = strtoupper(trim($row['budget_currency'] ?? 'USD'));

        // Create Overview
        $overview = SellersCompanyOverview::create([
            'reg_name'            => $companyRegName,
            'hq_country'          => $hqCountryId,
            'company_type'        => 'Corporate',
            'industry_ops'        => $industries,
            'company_rank'        => $rank,
            'reason_ma'           => $row['reason_for_mna'] ?? null,
            'planned_sale_share_ratio' => $row['planned_sale_share_ratio'] ?? null,
            'status'              => 'Active',
            'details'             => $row['details'] ?? null,
            'email'               => $row['email'] ?? null,
            'website'             => $row['website_url'] ?? null,
            'teaser_link'         => $row['teaser_link'] ?? null,
            'seller_contact_name' => $row['contact_person'] ?? null,
            'seller_designation'  => $row['position'] ?? null,
            'seller_email'        => $row['email'] ?? null,
        ]);

        // Create Parent Seller Record
        Seller::create([
            'seller_id' => $projectCode,
            'company_overview_id' => $overview->id,
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
            'code'           => 'nullable|string',
            'rank'           => 'nullable|string|max:1',
            'company_name'   => 'nullable|string|max:255',
            'hq'             => 'nullable|string',
            'industry'       => 'nullable|string',
            'details'        => 'nullable|string',
            'reason_for_mna' => 'nullable|string',
            'planned_sale_share_ratio' => 'nullable|string',
            'budget_min'     => 'nullable',
            'budget_max'     => 'nullable',
            'budget_currency'=> 'nullable|string|max:10',
            'website_url'    => 'nullable|string',
            'teaser_link'    => 'nullable|string',
            'contact_person' => 'nullable|string',
            'position'       => 'nullable|string',
            'email'          => 'nullable|string',
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
