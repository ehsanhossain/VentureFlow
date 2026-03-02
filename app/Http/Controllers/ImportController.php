<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\Investor;
use App\Models\InvestorsCompanyOverview;
use App\Models\Industry;
use App\Models\Target;
use App\Models\TargetsCompanyOverview;
use App\Models\TargetsFinancialDetail;
use App\Models\Country;
use App\Services\ImportValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportController extends Controller
{
    private ImportValidationService $validationService;

    public function __construct(ImportValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

    /**
     * Step 1 — Parse and validate an uploaded file.
     * Returns structured preview data with errors and suggestions.
     *
     * POST /api/import/validate/{type}
     */
    public function validate(Request $request, string $type)
    {
        if (!in_array($type, ['investor', 'target'])) {
            return response()->json(['message' => 'Invalid type. Use "investor" or "target".'], 422);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid file.',
                'errors' => $validator->errors()->toArray(),
            ], 422);
        }

        try {
            $file = $request->file('file');
            $rows = $this->parseFile($file, $type);

            if (empty($rows)) {
                return response()->json([
                    'message' => 'The file appears to be empty or has no data rows.',
                    'summary' => ['total' => 0, 'valid' => 0, 'errors' => 0],
                    'rows' => [],
                ], 200);
            }

            // Check for duplicate project codes within the file
            $this->checkIntraFileDuplicates($rows, $type);

            // Check for existing project codes in the database
            $this->checkDatabaseDuplicates($rows, $type);

            // Validate all rows
            $result = $this->validationService->validateAllRows($rows, $type);

            return response()->json($result, 200);

        } catch (\Exception $e) {
            Log::error("Import validation failed: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to parse and validate the file.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Step 2 — Confirm import of validated rows.
     * Receives the final row data (possibly user-corrected) and saves to DB.
     *
     * POST /api/import/confirm/{type}
     */
    public function confirm(Request $request, string $type)
    {
        if (!in_array($type, ['investor', 'target'])) {
            return response()->json(['message' => 'Invalid type. Use "investor" or "target".'], 422);
        }

        $validator = Validator::make($request->all(), [
            'rows' => 'required|array|min:1',
            'rows.*.data' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid request payload.',
                'errors' => $validator->errors()->toArray(),
            ], 422);
        }

        $rows = $request->input('rows');
        $imported = 0;
        $skipped = 0;
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($rows as $index => $rowPayload) {
                $rowData = $rowPayload['data'];
                $rowIndex = $rowPayload['rowIndex'] ?? ($index + 2);

                try {
                    if ($type === 'investor') {
                        $this->saveInvestorRow($rowData);
                    } else {
                        $this->saveTargetRow($rowData);
                    }
                    $imported++;
                } catch (\Exception $e) {
                    Log::warning("Import row {$rowIndex} failed: " . $e->getMessage());
                    $errors[] = [
                        'rowIndex' => $rowIndex,
                        'companyName' => $rowData['company_name'] ?? 'Unknown',
                        'error' => $e->getMessage(),
                    ];
                    $skipped++;
                }
            }

            DB::commit();

            return response()->json([
                'message' => "Import completed. {$imported} records imported, {$skipped} skipped.",
                'imported' => $imported,
                'skipped' => $skipped,
                'errors' => $errors,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Import confirm failed: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Import failed. All changes have been rolled back.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Parse an uploaded file into an array of associative rows.
     */
    private function parseFile($file, string $type): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $readerType = match ($extension) {
            'xlsx' => 'Xlsx',
            'xls' => 'Xls',
            'csv' => 'Csv',
            default => throw new \Exception("Unsupported file format: {$extension}"),
        };

        $reader = IOFactory::createReader($readerType);

        // For XLSX/XLS, we need to find the correct sheet. For CSV, there's usually only one.
        if ($readerType === 'Xlsx' || $readerType === 'Xls') {
            // Load the spreadsheet without specifying sheets first, to inspect all sheets
            $spreadsheet = $reader->load($file->getRealPath());

            $expectedSheetName = ($type === 'investor' ? 'Investors' : 'Targets');
            // Also check singular form so "Target Upload" matches when looking for "Targets"
            $keyword = $type === 'investor' ? 'investor' : 'target';
            $sheetNames = $spreadsheet->getSheetNames();
            $foundSheetName = null;

            // Try to find a sheet with a matching name:
            // 1. Sheet name contains the full expected name ("Targets", "Investors")
            // 2. Sheet name contains the singular keyword ("target", "investor")
            foreach ($sheetNames as $sheetName) {
                $lowerSheet = strtolower($sheetName);
                if (str_contains($lowerSheet, strtolower($expectedSheetName)) || str_contains($lowerSheet, $keyword)) {
                    $foundSheetName = $sheetName;
                    break;
                }
            }

            if ($foundSheetName) {
                $worksheet = $spreadsheet->getSheetByName($foundSheetName);
            } else {
                // Fallback to the first sheet if no specific sheet is found
                $worksheet = $spreadsheet->getActiveSheet();
                Log::warning("Could not find sheet '{$expectedSheetName}' in {$file->getClientOriginalName()}. Using the first available sheet: '{$worksheet->getTitle()}'.");
            }
        } else { // CSV
            // For CSV, load directly, getActiveSheet will pick the only one
            $spreadsheet = $reader->load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
        }

        if (!$worksheet) {
            throw new \Exception("Could not load any worksheet from the file.");
        }

        $rows = [];
        $headers = [];
        $isFirstRow = true;

        foreach ($worksheet->getRowIterator() as $row) {
            $cellIterator = $row->getCellIterator();
            $cellIterator->setIterateOnlyExistingCells(false);

            $rowData = [];
            foreach ($cellIterator as $cell) {
                $rowData[] = $cell->getValue();
            }

            if ($isFirstRow) {
                // Normalize headers: lowercase, underscores, trim
                $headers = array_map(function ($h) {
                    if (is_null($h)) return '';
                    $h = trim((string) $h);
                    $h = str_replace(' *', '', $h); // Remove required marker
                    $h = strtolower(preg_replace('/[^a-zA-Z0-9&]+/', '_', $h));
                    $h = trim($h, '_');
                    return $h;
                }, $rowData);
                $isFirstRow = false;
                continue;
            }

            // Skip completely empty rows
            $isAllEmpty = true;
            foreach ($rowData as $cell) {
                if (!is_null($cell) && trim((string) $cell) !== '') {
                    $isAllEmpty = false;
                    break;
                }
            }
            if ($isAllEmpty) continue;

            // Map to associative array using header keys
            $mapped = $this->mapRowToColumns($rowData, $headers, $type);
            if (!empty($mapped)) {
                $rows[] = $mapped;
            }
        }

        return $rows;
    }

    /**
     * Map raw row values to the expected column keys using header matching.
     */
    private function mapRowToColumns(array $rowData, array $headers, string $type): array
    {
        $columns = $type === 'investor'
            ? $this->validationService->getInvestorColumns()
            : $this->validationService->getTargetColumns();

        $columnKeys = array_column($columns, 'key');
        $columnLabels = array_column($columns, 'label');

        $mapped = [];

        // Build a lookup: normalized label → column key
        $labelToKey = [];
        foreach ($columns as $col) {
            $normalizedLabel = strtolower(preg_replace('/[^a-zA-Z0-9&]+/', '_', $col['label']));
            $normalizedLabel = trim($normalizedLabel, '_');
            $labelToKey[$normalizedLabel] = $col['key'];
            // Also add the raw key as a mapping
            $labelToKey[$col['key']] = $col['key'];
        }

        foreach ($headers as $colIdx => $header) {
            if ($header === '' || !isset($rowData[$colIdx])) continue;

            $matchedKey = $labelToKey[$header] ?? null;

            // Try fuzzy header matching if exact match fails
            if (!$matchedKey) {
                foreach ($labelToKey as $label => $key) {
                    if (str_contains($header, $label) || str_contains($label, $header)) {
                        $matchedKey = $key;
                        break;
                    }
                }
            }

            if ($matchedKey) {
                $value = $rowData[$colIdx];
                $mapped[$matchedKey] = is_null($value) ? null : trim((string) $value);
            }
        }

        return $mapped;
    }

    /**
     * Check for duplicate project codes within the uploaded file itself.
     */
    private function checkIntraFileDuplicates(array &$rows, string $type): void
    {
        $seenCodes = [];
        foreach ($rows as $idx => &$row) {
            $code = $row['project_code'] ?? null;
            if (!$code) continue;

            $upperCode = strtoupper(trim($code));
            if (isset($seenCodes[$upperCode])) {
                $row['_duplicate_in_file'] = true;
            } else {
                $seenCodes[$upperCode] = true;
            }
        }
    }

    /**
     * Check if project codes in the file already exist in the database.
     */
    private function checkDatabaseDuplicates(array &$rows, string $type): void
    {
        $codes = [];
        foreach ($rows as $row) {
            $code = $row['project_code'] ?? null;
            if ($code) $codes[] = strtoupper(trim($code));
        }

        if (empty($codes)) return;

        if ($type === 'investor') {
            $existing = Investor::whereIn('buyer_id', $codes)->pluck('buyer_id')->toArray();
        } else {
            $existing = Target::whereIn('seller_id', $codes)->pluck('seller_id')->toArray();
        }

        $existingUpper = array_map('strtoupper', $existing);

        foreach ($rows as &$row) {
            $code = $row['project_code'] ?? null;
            if ($code && in_array(strtoupper(trim($code)), $existingUpper)) {
                $row['_duplicate_in_db'] = true;
            }
        }
    }

    /**
     * Save a single validated investor row to the database.
     */
    private function saveInvestorRow(array $data): void
    {
        $companyName = $data['company_name'] ?? null;
        $projectCode = $data['project_code'] ?? null;

        // "Use as Project" logic: if company_name contains the word "Project",
        // set the name to "Project {ProjectCode}" (mirrors the registration toggle)
        if ($companyName && stripos($companyName, 'project') !== false && $projectCode) {
            $companyName = "Project {$projectCode}";
        } elseif (empty($companyName)) {
            throw new \Exception("Company Name is required.");
        }

        // Resolve country
        $hqCountryId = null;
        if (!empty($data['origin_country'])) {
            $hqCountryId = $this->validationService->resolveCountryId($data['origin_country']);
        }

        // Parse multi-value fields
        $targetCountries = $this->validationService->parseCommaSeparated($data['target_countries'] ?? null);
        $targetIndustries = $this->resolveIndustryNames($data['target_industries'] ?? null);
        $companyIndustry = $this->resolveIndustryNames($data['company_industry'] ?? null);
        $purposeMNA = $this->validationService->parseCommaSeparated($data['purpose_mna'] ?? null);
        $investmentCondition = $this->validationService->parseCommaSeparated($data['investment_condition'] ?? null);
        $internalPic = $this->validationService->parseCommaSeparated($data['internal_pic'] ?? null);
        $financialAdvisor = $this->validationService->parseCommaSeparated($data['financial_advisor'] ?? null);

        // Build contacts array
        $contacts = [];
        if (!empty($data['contact_name'])) {
            $contacts[] = [
                'name' => $data['contact_name'],
                'email' => $data['contact_email'] ?? '',
                'phone' => $data['contact_phone'] ?? '',
                'designation' => $data['contact_designation'] ?? '',
                'isPrimary' => true,
            ];
        }

        // Build website array
        $websiteLinks = [];
        if (!empty($data['website'])) {
            $websiteLinks = [['url' => $data['website']]];
        }

        // Build HQ address
        $hqAddress = [];
        if (!empty($data['hq_address'])) {
            $hqAddress = [['label' => 'HQ', 'address' => $data['hq_address']]];
        }

        // Rank with default
        $rank = strtoupper(trim($data['rank'] ?? 'B'));
        if (!in_array($rank, ['A', 'B', 'C'])) $rank = 'B';

        // Budget
        $budgetMin = $this->cleanNumber($data['budget_min'] ?? null);
        $budgetMax = $this->cleanNumber($data['budget_max'] ?? null);
        $budgetCurrency = strtoupper(trim($data['budget_currency'] ?? 'USD'));

        // Create the company overview
        $overview = InvestorsCompanyOverview::create([
            'reg_name'              => $companyName,
            'hq_country'            => $hqCountryId,
            'company_type'          => 'Corporate',
            'rank'                  => $rank,
            'reason_ma'             => json_encode($purposeMNA),
            'status'                => 'Active',
            'details'               => $data['project_details'] ?? null,
            'website'               => $websiteLinks,
            'hq_address'            => $hqAddress,
            'contacts'              => $contacts,
            'investment_budget'     => [
                'min' => $budgetMin,
                'max' => $budgetMax,
                'currency' => $budgetCurrency,
            ],
            'investment_condition'  => json_encode($investmentCondition),
            'target_countries'      => $this->resolveCountryNames($data['target_countries'] ?? null),
            'main_industry_operations' => $targetIndustries,
            'company_industry'      => $companyIndustry,
            'internal_pic'          => $internalPic,
            'financial_advisor'     => $financialAdvisor,
            'investor_profile_link' => $data['investor_profile_link'] ?? null,
            'channel'               => $data['channel'] ?? null,
            'seller_contact_name'   => $data['contact_name'] ?? null,
            'seller_email'          => $data['contact_email'] ?? null,
        ]);

        // Create the parent buyer record
        $projectCode = $data['project_code'] ?? null;
        Investor::create([
            'buyer_id' => $projectCode,
            'company_overview_id' => $overview->id,
            'status' => 'Active',
        ]);
    }

    /**
     * Save a single validated target row to the database.
     */
    private function saveTargetRow(array $data): void
    {
        $companyName = $data['company_name'] ?? null;
        $projectCode = $data['project_code'] ?? null;

        // "Use as Project" logic: if company_name contains the word "Project",
        // set the name to "Project {ProjectCode}" (mirrors the registration toggle)
        if ($companyName && stripos($companyName, 'project') !== false && $projectCode) {
            $companyName = "Project {$projectCode}";
        } elseif (empty($companyName)) {
            throw new \Exception("Company Name is required.");
        }

        // Resolve country
        $hqCountryId = null;
        if (!empty($data['origin_country'])) {
            $hqCountryId = $this->validationService->resolveCountryId($data['origin_country']);
        }

        // Parse multi-value fields
        $industries = $this->resolveIndustryNames($data['industry'] ?? null);
        $reasonMA = $this->validationService->parseCommaSeparated($data['reason_for_ma'] ?? null);
        $investmentCondition = $this->validationService->parseCommaSeparated($data['investment_condition'] ?? null);

        // Build contacts array (with department)
        $contacts = [];
        if (!empty($data['contact_name'])) {
            $contacts[] = [
                'name' => $data['contact_name'],
                'designation' => $data['contact_designation'] ?? '',
                'department' => $data['contact_department'] ?? '',
                'email' => $data['contact_email'] ?? '',
                'phone' => $data['contact_phone'] ?? '',
                'isPrimary' => true,
            ];
        }

        // Build website links
        $websiteLinks = [];
        if (!empty($data['website'])) {
            $websiteLinks = [['url' => $data['website']]];
        }

        // Rank
        $rank = strtoupper(trim($data['rank'] ?? 'B'));
        if (!in_array($rank, ['A', 'B', 'C'])) $rank = 'B';

        // Financials
        $investmentMin = $this->cleanNumber($data['desired_investment_min'] ?? null);
        $investmentMax = $this->cleanNumber($data['desired_investment_max'] ?? null);
        $investmentCurrency = strtoupper(trim($data['investment_currency'] ?? 'USD'));
        $ebitda = $this->cleanNumber($data['ebitda'] ?? null);

        // Create company overview
        $overview = TargetsCompanyOverview::create([
            'reg_name'           => $companyName,
            'hq_country'         => $hqCountryId,
            'company_type'       => 'Corporate',
            'industry_ops'       => $industries,
            'company_rank'       => $rank,
            'reason_ma'          => $reasonMA ? implode(', ', $reasonMA) : null, // reason_ma is VARCHAR — not JSON
            'status'             => 'Active',
            'details'            => $data['project_details'] ?? null,
            'website_links'      => $websiteLinks,
            'contacts'           => $contacts,
            'teaser_link'        => $data['teaser_link'] ?? null,
            'channel'            => $data['channel'] ?? null,
            'seller_contact_name'=> $data['contact_name'] ?? null,
            'seller_designation' => $data['contact_designation'] ?? null,
            'seller_email'       => $data['contact_email'] ?? null,
        ]);

        // Create financial details
        // IMPORTANT: ebitda_value uses {min, max} schema (consistent with registration form + filter queries)
        // The DB filters use json_extract(ebitda_value, '$.max') / '$.min'
        $financial = TargetsFinancialDetail::create([
            'expected_investment_amount' => [
                'min' => $investmentMin,
                'max' => $investmentMax,
            ],
            'default_currency' => $investmentCurrency,
            'ebitda_value'     => $ebitda ? ['min' => $ebitda, 'max' => $ebitda] : null,
            'ebitda_details'   => $data['ebitda_details'] ?? null,
            'investment_condition' => !empty($investmentCondition) ? json_encode($investmentCondition) : null, // stored as raw JSON string (no model cast)
        ]);

        // Create parent seller record
        // IMPORTANT: targets.status uses numeric '1' (Active), '2' (Draft) — NOT the string 'Active'
        // The prospects query filters by status = '1', so we must use the numeric convention
        Target::create([
            'seller_id' => $projectCode,
            'company_overview_id' => $overview->id,
            'financial_detail_id' => $financial->id,
            'status' => '1', // '1' = Active (numeric convention for targets table)
        ]);
    }

    /**
     * Resolve comma-separated industry names into an array of {id, name} objects.
     */
    private function resolveIndustryNames(?string $raw): array
    {
        if (!$raw) return [];
        $items = $this->validationService->parseCommaSeparated($raw);
        $resolved = [];
        foreach ($items as $name) {
            $id = $this->validationService->resolveIndustryId($name);
            if ($id) {
                $resolved[] = ['id' => $id, 'name' => $name];
            } else {
                // Auto-create as ad-hoc industry (status = 'Ad-hoc')
                // Can be promoted to primary or merged later in Industry Settings
                $industry = Industry::firstOrCreate(
                    ['name' => trim($name)],
                    ['status' => 'Ad-hoc']
                );
                $resolved[] = ['id' => $industry->id, 'name' => $industry->name];
            }
        }
        return $resolved;
    }

    /**
     * Resolve comma-separated country names into an array of {id, name} objects.
     * Supports region aliases (e.g., 'APAC' → 'East Asia').
     */
    private function resolveCountryNames(?string $raw): array
    {
        if (!$raw) return [];
        $items = $this->validationService->parseCommaSeparated($raw);
        $resolved = [];
        foreach ($items as $name) {
            $id = $this->validationService->resolveCountryId($name);
            if ($id) {
                // Look up the official name from the database
                $country = Country::find($id);
                $resolved[] = ['id' => $id, 'name' => $country ? $country->name : $name];
            } else {
                // Store unresolved as name-only for flexibility
                $resolved[] = ['name' => $name];
            }
        }
        return $resolved;
    }

    /**
     * Clean a number value from user input.
     */
    private function cleanNumber($value): ?string
    {
        if (is_null($value) || trim((string) $value) === '') return null;
        $cleaned = filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        return $cleaned !== false && $cleaned !== '' ? $cleaned : null;
    }

    // ── Legacy endpoints (kept for backward compatibility, will be removed eventually) ──

    /**
     * @deprecated Use validate() + confirm() instead
     */
    public function importBuyersCompanyOverview(Request $request)
    {
        $file = $request->file('excel_file');

        try {
            $extension = strtolower($file->getClientOriginalExtension());
            $readerType = match ($extension) {
                'xlsx' => \Maatwebsite\Excel\Excel::XLSX,
                'xls' => \Maatwebsite\Excel\Excel::XLS,
                'csv' => \Maatwebsite\Excel\Excel::CSV,
                default => throw new \Exception("Unsupported file extension: $extension"),
            };

            Excel::import(new \App\Imports\BuyersCompanyOverviewSheetImport, $file->getRealPath(), null, $readerType);

            return response()->json([
                'message' => 'Company overview data imported successfully!'
            ], 200);

        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errorMessages = [];
            foreach ($failures as $failure) {
                $errorMessages[] = "Row " . $failure->row() . ": " . implode(", ", $failure->errors()) .
                    " (Attribute: " . $failure->attribute() .
                    ", Value: " . json_encode($failure->values()[$failure->attribute()] ?? 'N/A') . ")";
            }
            Log::error('Import Validation Errors via API: ', ['errors' => $errorMessages]);
            return response()->json([
                'message' => 'There were validation issues with the Excel file.',
                'errors' => $errorMessages
            ], 422);
        } catch (\Exception $e) {
            Log::error('Import General Error via API: ' . $e->getMessage(), ['stack' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'An unexpected error occurred during import.',
                'error_details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @deprecated Use validate() + confirm() instead
     */
    public function importSellersCompanyOverview(Request $request)
    {
        $file = $request->file('excel_file');

        try {
            $extension = strtolower($file->getClientOriginalExtension());
            $readerType = match ($extension) {
                'xlsx' => \Maatwebsite\Excel\Excel::XLSX,
                'xls' => \Maatwebsite\Excel\Excel::XLS,
                'csv' => \Maatwebsite\Excel\Excel::CSV,
                default => throw new \Exception("Unsupported file extension: $extension"),
            };

            Excel::import(new \App\Imports\SellersCompanyOverviewSheetImport, $file->getRealPath(), null, $readerType);

            return response()->json([
                'message' => 'Seller company overview data imported successfully!'
            ], 200);

        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errorMessages = [];
            foreach ($failures as $failure) {
                $errorMessages[] = "Row " . $failure->row() . ": " . implode(", ", $failure->errors()) .
                    " (Attribute: " . $failure->attribute() .
                    ", Value: " . json_encode($failure->values()[$failure->attribute()] ?? 'N/A') . ")";
            }
            Log::error('Import Validation Errors via API: ', ['errors' => $errorMessages]);
            return response()->json([
                'message' => 'There were validation issues with the Excel file.',
                'errors' => $errorMessages
            ], 422);
        } catch (\Exception $e) {
            Log::error('Import General Error via API: ' . $e->getMessage(), ['stack' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'An unexpected error occurred during import.',
                'error_details' => $e->getMessage()
            ], 500);
        }
    }
}
