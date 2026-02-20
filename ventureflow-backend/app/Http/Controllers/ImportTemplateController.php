<?php

namespace App\Http\Controllers;

use App\Services\ImportValidationService;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Facades\Log;

class ImportTemplateController extends Controller
{
    private ImportValidationService $validationService;

    public function __construct(ImportValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

    /**
     * Download an XLSX import template with dropdown validation.
     *
     * GET /api/import/template/{type}
     * @param string $type  'investor' or 'target'
     */
    public function download(string $type)
    {
        if (!in_array($type, ['investor', 'target'])) {
            return response()->json(['message' => 'Invalid template type. Use "investor" or "target".'], 422);
        }

        try {
            $spreadsheet = new Spreadsheet();
            $refData = $this->validationService->getReferenceData();
            $columns = $type === 'investor'
                ? $this->validationService->getInvestorColumns()
                : $this->validationService->getTargetColumns();

            // ── Build reference data sheets (hidden) ──
            $refSheets = $this->createReferenceSheets($spreadsheet, $refData);

            // ── Build main data sheet ──
            $dataSheet = $spreadsheet->getActiveSheet();
            $dataSheet->setTitle($type === 'investor' ? 'Investors' : 'Targets');

            // Style and populate headers
            $this->buildHeaderRow($dataSheet, $columns);

            // Apply dropdown validation where applicable
            $this->applyDropdownValidation($dataSheet, $columns, $refSheets, 1000);

            // Set column widths for readability
            $this->setColumnWidths($dataSheet, $columns);

            // Add instruction row as a comment on A1
            $dataSheet->getComment('A1')->getText()->createTextRun(
                "Fill in your data starting from row 2.\n" .
                "• Required fields are marked with * in the header.\n" .
                "• For multi-value fields (comma-separated), use commas: e.g., 'Japan, Singapore, Germany'.\n" .
                "• Dropdown fields have preset options — click the cell to see them.\n" .
                "• Do not modify the reference data sheets."
            );

            // Generate and return the file
            $writer = new Xlsx($spreadsheet);
            $filename = "ventureflow_{$type}_import_template.xlsx";

            $tempPath = storage_path("app/temp/{$filename}");
            if (!is_dir(dirname($tempPath))) {
                mkdir(dirname($tempPath), 0755, true);
            }
            $writer->save($tempPath);

            return response()->download($tempPath, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend();

        } catch (\Exception $e) {
            Log::error('Template generation failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Failed to generate template.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Build the header row with styling.
     */
    private function buildHeaderRow(Worksheet $sheet, array $columns): void
    {
        foreach ($columns as $colIndex => $col) {
            $cellRef = Coordinate::stringFromColumnIndex($colIndex + 1) . '1';
            $label = $col['required'] ? $col['label'] . ' *' : $col['label'];
            $sheet->setCellValue($cellRef, $label);
        }

        // Style the entire header row
        $lastCol = Coordinate::stringFromColumnIndex(count($columns));
        $headerRange = "A1:{$lastCol}1";

        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '064771'], // VentureFlow brand color
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '3B82F6'],
                ],
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(30);

        // Freeze the header row
        $sheet->freezePane('A2');
    }

    /**
     * Create hidden reference sheets for dropdown source data.
     * Returns a map of [optionKey => 'SheetName!$A$1:$A$N']
     */
    private function createReferenceSheets(Spreadsheet $spreadsheet, array $refData): array
    {
        $sheetMap = [];
        $refSheetConfigs = [
            'countries' => ['sheetName' => '_Ref_Countries', 'data' => $refData['countries']],
            'industries' => ['sheetName' => '_Ref_Industries', 'data' => $refData['industries']],
            'currencies' => ['sheetName' => '_Ref_Currencies', 'data' => $refData['currencies']],
            'ranks' => ['sheetName' => '_Ref_Ranks', 'data' => $refData['ranks']],
            'channels' => ['sheetName' => '_Ref_Channels', 'data' => $refData['channels']],
            'statuses' => ['sheetName' => '_Ref_Statuses', 'data' => $refData['statuses']],
        ];

        foreach ($refSheetConfigs as $key => $config) {
            $sheet = $spreadsheet->createSheet();
            $sheet->setTitle($config['sheetName']);

            foreach ($config['data'] as $i => $value) {
                $sheet->setCellValue('A' . ($i + 1), $value);
            }

            $rowCount = count($config['data']);
            if ($rowCount > 0) {
                $sheetMap[$key] = "'{$config['sheetName']}'!\$A\$1:\$A\${$rowCount}";
            }

            // Hide the reference sheet
            $sheet->setSheetState(Worksheet::SHEETSTATE_HIDDEN);
        }

        // Set the main data sheet as active again
        $spreadsheet->setActiveSheetIndex(0);

        return $sheetMap;
    }

    /**
     * Apply Excel data validation (dropdown) to columns that need it.
     */
    private function applyDropdownValidation(Worksheet $sheet, array $columns, array $refSheets, int $maxRows): void
    {
        foreach ($columns as $colIndex => $col) {
            if ($col['type'] !== 'dropdown') continue;

            $optionKey = $col['options'] ?? null;
            if (!$optionKey || !isset($refSheets[$optionKey])) continue;

            $colLetter = Coordinate::stringFromColumnIndex($colIndex + 1);

            // Apply validation from row 2 to maxRows
            for ($row = 2; $row <= $maxRows; $row++) {
                $cellRef = "{$colLetter}{$row}";
                $validation = $sheet->getCell($cellRef)->getDataValidation();
                $validation->setType(DataValidation::TYPE_LIST);
                $validation->setErrorStyle(DataValidation::STYLE_WARNING);
                $validation->setAllowBlank(true);
                $validation->setShowInputMessage(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowDropDown(true);
                $validation->setErrorTitle('Invalid Value');
                $validation->setError("Please select a value from the dropdown list for '{$col['label']}'.");
                $validation->setPromptTitle($col['label']);
                $validation->setPrompt("Select a value from the list.");
                $validation->setFormula1($refSheets[$optionKey]);
            }
        }
    }

    /**
     * Set reasonable column widths based on content type.
     */
    private function setColumnWidths(Worksheet $sheet, array $columns): void
    {
        foreach ($columns as $colIndex => $col) {
            $colLetter = Coordinate::stringFromColumnIndex($colIndex + 1);
            $width = match ($col['type']) {
                'text' => 25,
                'number' => 18,
                'dropdown' => 22,
                'comma_sep' => 35,
                default => 20,
            };

            // Wider for certain fields
            if (in_array($col['key'], ['project_details', 'ebitda_details'])) {
                $width = 40;
            }

            $sheet->getColumnDimension($colLetter)->setWidth($width);
        }
    }
}
