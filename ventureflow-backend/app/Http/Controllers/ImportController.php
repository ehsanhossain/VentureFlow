<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\BuyersCompanyOverviewSheetImport;
use App\Imports\SellersCompanyOverviewSheetImport;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ImportController extends Controller
{

    public function importBuyersCompanyOverview(Request $request)
    {
        // Get the uploaded file
        $file = $request->file('excel_file');

        try {
            // Get the file extension
            $extension = strtolower($file->getClientOriginalExtension());

            // Determine the reader type based on the extension
            $readerType = match ($extension) {
                'xlsx' => \Maatwebsite\Excel\Excel::XLSX,
                'xls' => \Maatwebsite\Excel\Excel::XLS,
                'csv' => \Maatwebsite\Excel\Excel::CSV,
                default => throw new \Exception("Unsupported file extension: $extension"),
            };

            // Perform the import using the correct reader type
            Excel::import(new BuyersCompanyOverviewSheetImport, $file->getRealPath(), null, $readerType);

            return response()->json([
                'message' => 'Company overview data imported successfully!'
            ], 200);

        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            // Handle row-level validation errors
            $failures = $e->failures();
            $errorMessages = [];

            foreach ($failures as $failure) {
                $errorMessages[] = "Row " . $failure->row() . ": " . implode(", ", $failure->errors()) .
                    " (Attribute: " . $failure->attribute() .
                    ", Value: " . json_encode($failure->values()[$failure->attribute()] ?? 'N/A') . ")";
            }

            \Log::error('Import Validation Errors via API: ', ['errors' => $errorMessages]);

            return response()->json([
                'message' => 'There were validation issues with the Excel file.',
                'errors' => $errorMessages
            ], 422);

        } catch (\Exception $e) {
            // Handle unexpected errors
            \Log::error('Import General Error via API: ' . $e->getMessage(), ['stack' => $e->getTraceAsString()]);

            return response()->json([
                'message' => 'An unexpected error occurred during import.',
                'error_details' => $e->getMessage()
            ], 500);
        }
    }

    public function importSellersCompanyOverview(Request $request)
    {
        // Get the uploaded file
        $file = $request->file('excel_file');

        try {
            // Get the file extension
            $extension = strtolower($file->getClientOriginalExtension());

            // Determine the reader type based on the extension
            $readerType = match ($extension) {
                'xlsx' => \Maatwebsite\Excel\Excel::XLSX,
                'xls' => \Maatwebsite\Excel\Excel::XLS,
                'csv' => \Maatwebsite\Excel\Excel::CSV,
                default => throw new \Exception("Unsupported file extension: $extension"),
            };

            // Perform the import using the correct reader type
            Excel::import(new SellersCompanyOverviewSheetImport, $file->getRealPath(), null, $readerType);

            return response()->json([
                'message' => 'Seller company overview data imported successfully!'
            ], 200);

        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            // Handle row-level validation errors
            $failures = $e->failures();
            $errorMessages = [];

            foreach ($failures as $failure) {
                $errorMessages[] = "Row " . $failure->row() . ": " . implode(", ", $failure->errors()) .
                    " (Attribute: " . $failure->attribute() .
                    ", Value: " . json_encode($failure->values()[$failure->attribute()] ?? 'N/A') . ")";
            }

            \Log::error('Import Validation Errors via API: ', ['errors' => $errorMessages]);

            return response()->json([
                'message' => 'There were validation issues with the Excel file.',
                'errors' => $errorMessages
            ], 422);

        } catch (\Exception $e) {
            // Handle unexpected errors
            \Log::error('Import General Error via API: ' . $e->getMessage(), ['stack' => $e->getTraceAsString()]);

            return response()->json([
                'message' => 'An unexpected error occurred during import.',
                'error_details' => $e->getMessage()
            ], 500);
        }
    }


    public function showImportForm()
    {
        return response(
            '<form action="/api/import/buyers-company-overview" method="POST" enctype="multipart/form-data">' .
            csrf_field() .
            '<input type="file" name="excel_file" required>' .
            '<button type="submit">Import</button></form>'
        )->header('Content-Type', 'text/html');
    }


}
