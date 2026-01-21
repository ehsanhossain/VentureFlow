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
        $row = $row->toArray(); // Converted by WithMapping already

        $commaSeparatedToArray = function ($value) {
            if (is_null($value) || trim($value) === '') {
                return [];
            }
            if (is_array($value)) {
                return $value;
            }
            return array_map('trim', explode(',', (string) $value));
        };

        $stringToBoolean = function ($value) {
            if (is_null($value)) return null;
            if (is_bool($value)) return $value;
            return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        };

        // Support both "Company Registered Name" and "Company Name" headers
        $companyRegName = $row['company_registered_name'] ?? $row['company_name'] ?? null;

        if (empty($companyRegName)) {
            Log::warning('Skipping row due to empty Company Name.', ['row_data' => $row]);
            return;
        }

        // Skip rows where company name is "N/A" or similar placeholder values
        $companyNameLower = trim(strtolower((string)$companyRegName));
        if (in_array($companyNameLower, ['n/a', 'na', 'n\\a', 'n\\/a', '', '-', 'null', 'undefined'])) {
            Log::info('Skipping row with placeholder Company Name: ' . $companyRegName);
            return;
        }

        // --- ID Generation Logic ---
        $countryName = $row['hq_origin_country'] ?? $row['hq_country'] ?? null;
        $hqCountryId = null;
        $sellerId = null;

        if ($countryName) {
            // Find Country by Name to get Alpha Code and ID
            $country = Country::where('name', $countryName)->first();

            if ($country) {
                $hqCountryId = $country->id;
                $countryAlpha = strtoupper($country->alpha_2_code ?? substr($countryName, 0, 2));

                // Generate Seller ID only if we have a valid Alpha Code
                if ($countryAlpha) {
                    $prefix = $countryAlpha . '-S-';
                    
                    // Find max existing sequence
                    // Implementation mimics SellerController::getLastSequence
                    $lastSeller = Seller::where('seller_id', 'LIKE', $prefix . '%')
                        ->select('seller_id')
                        ->get()
                        ->map(function ($item) use ($prefix) {
                            $numericPart = str_replace($prefix, '', $item->seller_id);
                            return (int) $numericPart;
                        })
                        ->max();

                    $nextSequence = ($lastSeller ? $lastSeller : 0) + 1;
                    $formattedSequence = str_pad($nextSequence, 3, '0', STR_PAD_LEFT); 
                    $sellerId = $prefix . $formattedSequence;
                }
            } else {
                 Log::warning("Country '{$countryName}' not found in database. Seller ID generation skipped.");
            }
        }

        // Create Seller Company Overview
        $overview = SellersCompanyOverview::create([
            'reg_name'                 => $companyRegName,
            'hq_country'               => $hqCountryId, // Store ID, not name
            'company_type'             => $row['company_type'] ?? null,
            'year_founded'             => $row['year_founded'] ?? null,
            'industry_ops'             => $commaSeparatedToArray($row['industry_operations'] ?? $row['industry'] ?? null),
            'emp_count'                => $row['current_employee_counts'] ?? null,
            'reason_ma'                => $row['reason_ma'] ?? null,
            'proj_start_date'          => $this->transformDate($row['project_start_date'] ?? null),
            'txn_timeline'             => $row['expected_transaction_timeline'] ?? null,
            'incharge_name'            => $row['our_person_in_charge'] ?? null,
            'no_pic_needed'            => $stringToBoolean($row['no_pic_needed'] ?? false),
            'status'                   => $row['status'] ?? null,
            'details'                  => $row['details'] ?? null,
            'email'                    => $row['company_s_email'] ?? null,
            'phone'                    => $row['company_s_phone_number'] ?? null,
            'hq_address'               => $this->parseAddress($row['hq_address'] ?? null),
            'shareholder_name'         => $commaSeparatedToArray($row['shareholder_name'] ?? null),
            'seller_contact_name'      => $row['seller_side_contact_person_name'] ?? null,
            'seller_designation'       => $row['designation_position'] ?? null,
            'seller_email'             => $row['email_address'] ?? null,
            'seller_phone'             => $commaSeparatedToArray($row['phone_number'] ?? null),
            'website'                  => $row['website_link'] ?? null,
            'linkedin'                 => $row['linkedin_link'] ?? null,
            'twitter'                  => $row['x_twitter_link'] ?? null,
            'facebook'                 => $row['facebook_link'] ?? null,
            'instagram'                => $row['instagram_link'] ?? null,
            'youtube'                  => $row['youtube_link'] ?? null,
            'seller_id'                => $sellerId, // Localized ID
        ]);

         // Create Parent Seller Record
         $seller = Seller::create([
            'seller_id' => $sellerId,
            'company_overview_id' => $overview->id,
            'status' => 1, // Defaulting to 1 (active) or draft as suitable, defaulting to active here or checking is_draft logic
        ]);
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function rules(): array
    {
        return [
            'company_registered_name'       => 'nullable|string|max:255',
            'hq_origin_country'             => 'nullable|string|max:100',
            'company_type'                  => 'nullable|string|max:100',
            'year_founded'                  => 'nullable|digits:4|integer|min:1000|max:' . date('Y'),
            'industry_operations'           => 'nullable|string',
            'current_employee_counts'       => 'nullable',
            'reason_ma'                     => 'nullable|string',
            'project_start_date'            => 'nullable',
            'expected_transaction_timeline' => 'nullable|string',
            'our_person_in_charge'          => 'nullable|string|max:100',
            'no_pic_needed'                 => 'nullable',
            'status'                        => 'nullable|string|max:50',
            'details'                       => 'nullable|string',
            'company_s_email'               => 'nullable|email|max:150',
            'company_s_phone_number'        => 'nullable|string|max:50',
            'hq_address'                    => 'nullable|string',
            'shareholder_name'              => 'nullable|string',
            'seller_side_contact_person_name' => 'nullable|string|max:100',
            'designation_position'          => 'nullable|string|max:100',
            'email_address'                 => 'nullable|email|max:150',
            'phone_number'                  => 'nullable|string',
            'website_link'                  => 'nullable|url|max:255',
            'linkedin_link'                 => 'nullable|url|max:255',
            'x_twitter_link'                => 'nullable|url|max:255',
            'facebook_link'                 => 'nullable|url|max:255',
            'instagram_link'                => 'nullable|url|max:255',
            'youtube_link'                  => 'nullable|url|max:255',
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
