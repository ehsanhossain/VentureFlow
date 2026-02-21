<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\Folder;
use App\Models\FileFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage; // Import the Storage facade
use Illuminate\Support\Facades\Log; // Use the Log facade

class FolderController extends Controller
{
    /**
     * Display a listing of the folders.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {

            $folders = Folder::all();

            // Return the folders as a JSON response
            return response()->json([
                'success' => true,
                'data' => $folders,
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Error fetching folders: ' . $e->getMessage());

            // Return an error response
            return response()->json([
                'success' => false,
                'message' => 'Could not fetch folders.',
                'error' => $e->getMessage(), // Include error message for debugging during development
            ], 500); // 500 Internal Server Error
        }
    }

    public function partnerFolders($partnerId)
    {
        try {
            // Get folder IDs related to the partner
            $folderIds = FileFolder::where('partner_id', $partnerId)->pluck('folder_id');

            // Retrieve folders
            $folders = Folder::whereIn('id', $folderIds)->get();

            return response()->json([
                'success' => true,
                'data' => $folders,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching folders for partner: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Could not fetch folders for the partner.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function sellerFolders($partnerId)
    {
        try {
            // Get folder IDs related to the partner
            $folderIds = FileFolder::where('seller_id', $partnerId)->pluck('folder_id');

            // Retrieve folders
            $folders = Folder::whereIn('id', $folderIds)->get();

            return response()->json([
                'success' => true,
                'data' => $folders,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching folders for seller: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Could not fetch folders for the seller.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function buyerFolders($partnerId)
    {
        try {
            // Get folder IDs related to the partner
            $folderIds = FileFolder::where('buyer_id', $partnerId)->pluck('folder_id');

            // Retrieve folders
            $folders = Folder::whereIn('id', $folderIds)->get();

            return response()->json([
                'success' => true,
                'data' => $folders,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching folders for buyer: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Could not fetch folders for the buyer.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created folder in storage and create a physical directory.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',

        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $folderUuid = (string) Str::uuid();


        $basePath = 'folders';
        $folderPath = $basePath . '/' . $folderUuid;


        try {
            $created = Storage::disk('local')->makeDirectory($folderPath);

            if (!$created) {
                Log::error('Failed to create physical directory: ' . $folderPath);
                return response()->json([
                    'success' => false,
                    'message' => 'Could not create physical folder directory.',
                ], 500);
            }

            $folder = new Folder();
            $folder->id = $folderUuid;
            $folder->name = $request->name;
            $folder->path = $folderPath; // Store the *stable* physical path in the database


            $folder->save();

            FileFolder::create([
                'id' => Str::uuid(),
                'folder_id' => $folder->id,
                'seller_id' => $request->input('seller_id'),
                'buyer_id' => $request->input('buyer_id'),
                'partner_id' => $request->input('partner_id'),
            ]);

            // Return the newly created folder data
            return response()->json([
                'success' => true,
                'message' => 'Folder created successfully.',
                'data' => $folder,
            ], 201); // 201 Created

        } catch (\Exception $e) {
            if (isset($folderPath)) {
                Storage::disk('local')->deleteDirectory($folderPath);
                Log::warning('Cleaned up physical directory after database error: ' . $folderPath . ' - ' . $e->getMessage());
            }

            Log::error('Error creating folder and directory: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Could not create folder.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified folder.
     * (Optional - the React component doesn't currently use this)
     *
     * @param  \App\Models\Folder  $folder
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Folder $folder)
    {
        try {
            // Return the specified folder as a JSON response
            return response()->json([
                'success' => true,
                'data' => $folder,
            ]);
        } catch (\Exception $e) {
            // Log the error
            Log::error('Error fetching folder ' . $folder->id . ': ' . $e->getMessage());

            // Return an error response
            return response()->json([
                'success' => false,
                'message' => 'Could not fetch folder.',
                'error' => $e->getMessage(),
            ], 500); // 500 Internal Server Error
        }
    }

    /**
     * Update the specified folder in storage.
     * This method updates the database record but does NOT rename the physical directory.
     * The physical directory path is considered a stable identifier.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Folder  $folder
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Folder $folder)
    {
        // Validate the incoming request data
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        // If validation fails, return validation errors
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422); // 422 Unprocessable Entity
        }

        try {
            // Update the folder's name in the database
            $folder->name = $request->name;
            $folder->save();

            // Return the updated folder as a JSON response
            return response()->json([
                'success' => true,
                'message' => 'Folder updated successfully.',
                'data' => $folder, // Return the updated folder data
            ]);
        } catch (\Exception $e) {
            // If physical rename succeeded but database update failed, you'd need rollback logic
            // (e.g., attempt to rename the physical directory back to the old path)
            Log::error('Error updating folder ' . $folder->id . ': ' . $e->getMessage());

            // Return an error response
            return response()->json([
                'success' => false,
                'message' => 'Could not update folder.',
                'error' => $e->getMessage(), // Include error message for debugging during development
            ], 500); // 500 Internal Server Error
        }
    }

    /**
     * Remove the specified folder from storage and delete the physical directory.
     *
     * @param  \App\Models\Folder  $folder
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Folder $folder)
    {
        try {
            // Store the path before deleting the database record
            $folderPath = $folder->path;


            $folder->delete();

            $deleted = Storage::disk('local')->deleteDirectory($folderPath);

            if (!$deleted) {

                Log::warning('Failed to delete physical directory for folder ' . $folder->id . ': ' . $folderPath);

            }

            // Return a success response
            return response()->json([
                'success' => true,
                'message' => 'Folder deleted successfully.',

            ]);
        } catch (\Exception $e) {

            Log::error('Error deleting folder ' . $folder->id . ': ' . $e->getMessage());

            // Return an error response
            return response()->json([
                'success' => false,
                'message' => 'Could not delete folder.',
                'error' => $e->getMessage(), // Include error message for debugging during development
            ], 500); // 500 Internal Server Error
        }
    }
}
