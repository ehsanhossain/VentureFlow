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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;
use App\Http\Resources\FileResource;

class FileController extends Controller
{
    /**
     * Display a listing of the files.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {

        $fileFolders = FileFolder::where('folder_id', $request->folder_id)
            ->whereNotNull('file_id')
            ->get();

        $files = File::whereIn('id', $fileFolders->pluck('file_id'))->orderBy('created_at', 'desc')->get();

        return response()->json(['data' => FileResource::collection($files)]);
    }

    /**
     * Store a newly created file in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'files' => 'required|array',
            'files.*' => 'file|max:204800', // each file must be a file and max 200MB
            'folder_id' => 'nullable|exists:folders,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $folder = $request->filled('folder_id') ? Folder::find($request->folder_id) : null;
        $storedFiles = [];

        foreach ($request->file('files') as $uploadedFile) {
            $fileUuid = Str::uuid();
            $filename = $fileUuid . '.' . $uploadedFile->getClientOriginalExtension();
            $basePath = $folder ? $folder->path : 'uploads';

            $path = $uploadedFile->storeAs($basePath, $filename, 'local');
            if (!$path) {
                continue;
            }

            $file = File::create([
                'id' => $fileUuid,
                'filename' => $uploadedFile->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $uploadedFile->getMimeType(),
                'size' => $uploadedFile->getSize(),
            ]);

            // Prepare common pivot data
            $pivotData = [
                'id' => Str::uuid(),
                'file_id' => $file->id,
            ];

            // Add folder if present
            if ($folder) {
                $pivotData['folder_id'] = $folder->id;
            }

            // Conditionally add optional IDs
            foreach (['seller_id', 'buyer_id', 'partner_id'] as $relationKey) {
                if ($request->filled($relationKey)) {
                    $pivotData[$relationKey] = $request->input($relationKey);
                }
            }

            // Create or update the pivot record
            if ($folder) {
                $existing = FileFolder::where('folder_id', $folder->id)
                    ->whereNull('file_id')
                    ->first();

                if ($existing) {
                    $existing->update(array_merge(['file_id' => $file->id], $pivotData));
                } else {
                    FileFolder::create($pivotData);
                }
            } else {
                FileFolder::create($pivotData);
            }

            $storedFiles[] = $file;
        }

        return response()->json($storedFiles, Response::HTTP_CREATED);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $file = File::find($id);

        if (!$file) {
            return response()->json(['message' => 'File not found'], Response::HTTP_NOT_FOUND);
        }

        $file->filename = $request->input('name');
        $file->save();

        return response()->json([
            'message' => 'File name updated successfully',
            'file' => $file,
        ], Response::HTTP_OK);
    }




    /**
     * Display the specified file.
     *
     * @param  string  $id // Using string for UUID
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        // Find the file by its UUID
        $file = File::find($id);

        // If file not found, return a 404 response
        if (!$file) {
            return response()->json(['message' => 'File not found'], Response::HTTP_NOT_FOUND);
        }

        // Return the file record as a JSON response
        return response()->json($file, Response::HTTP_OK);
    }

    /**
     * Remove the specified file from storage.
     *
     * @param  string  $id // Using string for UUID
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(string $id)
    {
        // Find the file by its UUID
        $file = File::find($id);

        // If file not found, return a 404 response
        if (!$file) {
            return response()->json(['message' => 'File not found'], Response::HTTP_NOT_FOUND);
        }

        // Delete the physical file from storage, explicitly using the 'local' disk
        if (Storage::disk('local')->exists($file->path)) {
            Storage::disk('local')->delete($file->path);
        }

        // Delete the file record from the database
        $file->delete();

        // Return a success response
        return response()->json(['message' => 'File deleted successfully'], Response::HTTP_OK);
    }

    public function download($fileId)
    {
        // Find the file by UUID
        $file = File::find($fileId);

        if (!$file) {
            return response()->json(['message' => 'File not found.'], Response::HTTP_NOT_FOUND);
        }

        // Check if file exists in storage
        if (!Storage::disk('local')->exists($file->path)) {
            return response()->json(['message' => 'File not found on disk.'], Response::HTTP_NOT_FOUND);
        }

        // Return file as download response with original filename and mime type
        return Storage::disk('local')->download($file->path, $file->filename, [
            'Content-Type' => $file->mime_type,
        ]);
    }
}
