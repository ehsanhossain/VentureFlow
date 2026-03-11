<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Http\Controllers;

use App\Models\DriveFolder;
use App\Models\DriveFile;
use App\Models\DriveFileVersion;
use App\Models\DriveComment;
use App\Models\DriveShare;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DriveController extends Controller
{
    // ═══════════════════════════════════════════════════════════════════════════
    // LISTING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * List root-level contents of a prospect's Flowdrive.
     * GET /api/drive/{type}/{prospectId}
     */
    public function index(Request $request, string $type, string $prospectId): JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $search = trim($request->query('search', ''));

        $foldersQuery = DriveFolder::forProspect($type, $prospectId)
            ->rootLevel()
            ->withCount(['children', 'files'])
            ->with('creator:id,name')
            ->orderBy('name');

        $filesQuery = DriveFile::forProspect($type, $prospectId)
            ->inFolder(null)
            ->with('uploader:id,name')
            ->orderBy('original_name');

        if ($search !== '') {
            $foldersQuery->where('name', 'LIKE', "%{$search}%");
            $filesQuery->where('original_name', 'LIKE', "%{$search}%");
        }

        return response()->json([
            'folders' => $foldersQuery->get(),
            'files' => $filesQuery->get(),
        ]);
    }

    /**
     * List contents of a specific folder.
     * GET /api/drive/{type}/{prospectId}/folder/{folderId}
     */
    public function folderContents(Request $request, string $type, string $prospectId, string $folderId): JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $folder = DriveFolder::forProspect($type, $prospectId)->findOrFail($folderId);

        $search = trim($request->query('search', ''));

        $subfoldersQuery = DriveFolder::where('parent_id', $folderId)
            ->withCount(['children', 'files'])
            ->with('creator:id,name')
            ->orderBy('name');

        $filesQuery = DriveFile::forProspect($type, $prospectId)
            ->inFolder($folderId)
            ->with('uploader:id,name')
            ->orderBy('original_name');

        if ($search !== '') {
            $subfoldersQuery->where('name', 'LIKE', "%{$search}%");
            $filesQuery->where('original_name', 'LIKE', "%{$search}%");
        }

        // Build breadcrumb trail
        $breadcrumbs = $this->buildBreadcrumbs($folder);

        return response()->json([
            'folder' => $folder,
            'breadcrumbs' => $breadcrumbs,
            'subfolders' => $subfoldersQuery->get(),
            'files' => $filesQuery->get(),
        ]);
    }

    /**
     * Global search across all files and folders for a prospect.
     * GET /api/drive/{type}/{prospectId}/search?q=...
     */
    public function search(Request $request, string $type, string $prospectId): JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $q = trim($request->query('q', ''));
        if ($q === '') {
            return response()->json(['folders' => [], 'files' => []]);
        }

        $folders = DriveFolder::forProspect($type, $prospectId)
            ->where('name', 'LIKE', "%{$q}%")
            ->with('creator:id,name')
            ->orderBy('name')
            ->limit(50)
            ->get();

        $files = DriveFile::forProspect($type, $prospectId)
            ->where('original_name', 'LIKE', "%{$q}%")
            ->with('uploader:id,name')
            ->orderBy('original_name')
            ->limit(50)
            ->get();

        return response()->json([
            'folders' => $folders,
            'files' => $files,
        ]);
    }

    /**
     * Get drive stats (total folder & file counts) for a prospect.
     * GET /api/drive/{type}/{prospectId}/stats
     */
    public function stats(string $type, string $prospectId): JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $folderCount = DriveFolder::where('prospect_type', $type)
            ->where('prospect_id', $prospectId)
            ->count();

        $fileCount = DriveFile::where('prospect_type', $type)
            ->where('prospect_id', $prospectId)
            ->count();

        return response()->json([
            'folder_count' => $folderCount,
            'file_count'   => $fileCount,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FOLDER OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Create a new folder.
     * POST /api/drive/{type}/{prospectId}/folder
     */
    public function createFolder(Request $request, string $type, string $prospectId): JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|uuid',
        ]);

        // Validate parent belongs to same prospect
        if ($request->parent_id) {
            DriveFolder::forProspect($type, $prospectId)->findOrFail($request->parent_id);
        }

        // Check for duplicate folder name in same location
        $existing = DriveFolder::forProspect($type, $prospectId)
            ->where('name', $request->name)
            ->where('parent_id', $request->parent_id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'A folder with this name already exists here.'], 422);
        }

        $folder = DriveFolder::create([
            'name' => $this->sanitizeName($request->name),
            'parent_id' => $request->parent_id,
            'prospect_type' => $type,
            'prospect_id' => $prospectId,
            'created_by' => $request->user()->id,
        ]);

        $folder->load('creator:id,name');

        return response()->json($folder, 201);
    }

    /**
     * Rename a folder.
     * PUT /api/drive/folder/{folderId}
     */
    public function renameFolder(Request $request, string $folderId): JsonResponse
    {
        $request->validate(['name' => 'required|string|max:255']);

        $folder = DriveFolder::findOrFail($folderId);

        // Check for duplicate name in same parent
        $existing = DriveFolder::where('parent_id', $folder->parent_id)
            ->where('prospect_type', $folder->prospect_type)
            ->where('prospect_id', $folder->prospect_id)
            ->where('name', $request->name)
            ->where('id', '!=', $folderId)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'A folder with this name already exists here.'], 422);
        }

        $folder->update(['name' => $this->sanitizeName($request->name)]);
        return response()->json($folder);
    }

    /**
     * Delete a folder and all contents (cascade).
     * DELETE /api/drive/folder/{folderId}
     */
    public function deleteFolder(string $folderId): JsonResponse
    {
        $folder = DriveFolder::findOrFail($folderId);

        // Count nested items for confirmation
        $fileCount = $this->countNestedFiles($folder);
        $folderCount = $this->countNestedFolders($folder);

        // Delete physical files
        $this->deletePhysicalFiles($folder);

        $folder->delete(); // cascade handles DB

        return response()->json([
            'message' => 'Folder deleted successfully.',
            'deleted_files' => $fileCount,
            'deleted_folders' => $folderCount,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FILE UPLOAD
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Upload file(s) — standard upload for small files (< 5MB).
     * POST /api/drive/{type}/{prospectId}/upload
     */
    public function upload(Request $request, string $type, string $prospectId): JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $request->validate([
            'files' => 'required|array|max:20',
            'files.*' => 'required|file|max:102400', // 100MB max per file
            'folder_id' => 'nullable|uuid',
        ]);

        // Validate folder belongs to the prospect
        if ($request->folder_id) {
            DriveFolder::forProspect($type, $prospectId)->findOrFail($request->folder_id);
        }

        $uploaded = [];

        foreach ($request->file('files') as $file) {
            if ($file->getSize() === 0) {
                continue; // Skip zero-byte files
            }

            $fileId = (string) Str::uuid();
            $extension = $file->getClientOriginalExtension();
            $storageName = $fileId . ($extension ? ".{$extension}" : '');
            $storagePath = "drive/{$type}s/{$prospectId}/{$storageName}";

            // Store the file
            Storage::disk('local')->put($storagePath, file_get_contents($file->getRealPath()));

            // Create DB record
            $driveFile = DriveFile::create([
                'id' => $fileId,
                'original_name' => $this->sanitizeName($file->getClientOriginalName()),
                'storage_path' => $storagePath,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'folder_id' => $request->folder_id,
                'prospect_type' => $type,
                'prospect_id' => $prospectId,
                'version' => 1,
                'uploaded_by' => $request->user()->id,
            ]);

            // Create initial version record
            DriveFileVersion::create([
                'file_id' => $fileId,
                'version_number' => 1,
                'storage_path' => $storagePath,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'uploaded_by' => $request->user()->id,
            ]);

            $driveFile->load('uploader:id,name');
            $uploaded[] = $driveFile;
        }

        return response()->json([
            'message' => count($uploaded) . ' file(s) uploaded.',
            'files' => $uploaded,
        ], 201);
    }

    /**
     * Upload a file chunk (for large files > 5MB).
     * POST /api/drive/{type}/{prospectId}/upload-chunk
     */
    public function uploadChunk(Request $request, string $type, string $prospectId): JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $request->validate([
            'chunk' => 'required|file',
            'upload_id' => 'required|string|max:64',
            'chunk_index' => 'required|integer|min:0',
            'total_chunks' => 'required|integer|min:1',
            'original_name' => 'required|string|max:255',
        ]);

        $uploadId = $request->upload_id;
        $chunkPath = "drive/chunks/{$uploadId}/chunk_{$request->chunk_index}";

        Storage::disk('local')->put($chunkPath, file_get_contents($request->file('chunk')->getRealPath()));

        return response()->json([
            'chunk_index' => $request->chunk_index,
            'received' => true,
        ]);
    }

    /**
     * Finalize a chunked upload — assemble chunks into final file.
     * POST /api/drive/{type}/{prospectId}/upload-complete
     */
    public function uploadComplete(Request $request, string $type, string $prospectId): JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $request->validate([
            'upload_id' => 'required|string|max:64',
            'total_chunks' => 'required|integer|min:1',
            'original_name' => 'required|string|max:255',
            'mime_type' => 'nullable|string|max:255',
            'folder_id' => 'nullable|uuid',
        ]);

        if ($request->folder_id) {
            DriveFolder::forProspect($type, $prospectId)->findOrFail($request->folder_id);
        }

        $uploadId = $request->upload_id;
        $fileId = (string) Str::uuid();
        $extension = pathinfo($request->original_name, PATHINFO_EXTENSION);
        $storageName = $fileId . ($extension ? ".{$extension}" : '');
        $finalPath = "drive/{$type}s/{$prospectId}/{$storageName}";

        // Assemble chunks
        $totalSize = 0;
        $assembledContent = '';
        for ($i = 0; $i < $request->total_chunks; $i++) {
            $chunkPath = "drive/chunks/{$uploadId}/chunk_{$i}";
            if (!Storage::disk('local')->exists($chunkPath)) {
                return response()->json(['message' => "Missing chunk {$i}."], 422);
            }
            $chunkContent = Storage::disk('local')->get($chunkPath);
            $assembledContent .= $chunkContent;
            $totalSize += strlen($chunkContent);
        }

        // Write final file
        Storage::disk('local')->put($finalPath, $assembledContent);

        // Clean up chunks
        Storage::disk('local')->deleteDirectory("drive/chunks/{$uploadId}");

        $mimeType = $request->mime_type ?: mime_content_type(Storage::disk('local')->path($finalPath));

        // Create DB record
        $driveFile = DriveFile::create([
            'id' => $fileId,
            'original_name' => $this->sanitizeName($request->original_name),
            'storage_path' => $finalPath,
            'mime_type' => $mimeType,
            'size' => $totalSize,
            'folder_id' => $request->folder_id,
            'prospect_type' => $type,
            'prospect_id' => $prospectId,
            'version' => 1,
            'uploaded_by' => $request->user()->id,
        ]);

        // Create initial version
        DriveFileVersion::create([
            'file_id' => $fileId,
            'version_number' => 1,
            'storage_path' => $finalPath,
            'size' => $totalSize,
            'mime_type' => $mimeType,
            'uploaded_by' => $request->user()->id,
        ]);

        $driveFile->load('uploader:id,name');

        return response()->json([
            'message' => 'File uploaded successfully.',
            'file' => $driveFile,
        ], 201);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FILE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Rename a file.
     * PUT /api/drive/file/{fileId}
     */
    public function renameFile(Request $request, string $fileId): JsonResponse
    {
        $request->validate(['name' => 'required|string|max:255']);
        $file = DriveFile::findOrFail($fileId);
        $file->update(['original_name' => $this->sanitizeName($request->name)]);
        return response()->json($file);
    }

    /**
     * Delete a file and all its versions.
     * DELETE /api/drive/file/{fileId}
     */
    public function deleteFile(string $fileId): JsonResponse
    {
        $file = DriveFile::findOrFail($fileId);

        // Delete all version files from storage
        foreach ($file->versions as $version) {
            if (Storage::disk('local')->exists($version->storage_path)) {
                Storage::disk('local')->delete($version->storage_path);
            }
        }

        // Delete current file from storage
        if (Storage::disk('local')->exists($file->storage_path)) {
            Storage::disk('local')->delete($file->storage_path);
        }

        $file->delete(); // cascade deletes versions, comments, shares

        return response()->json(['message' => 'File deleted successfully.']);
    }

    /**
     * Download the current version of a file.
     * GET /api/drive/file/{fileId}/download
     */
    public function downloadFile(string $fileId): StreamedResponse|JsonResponse
    {
        $file = DriveFile::findOrFail($fileId);

        if (!Storage::disk('local')->exists($file->storage_path)) {
            return response()->json(['message' => 'File not found on disk.'], 404);
        }

        return Storage::disk('local')->download($file->storage_path, $file->original_name);
    }

    /**
     * Preview a file in the browser (PDF, images, etc.).
     * GET /api/drive/file/{fileId}/preview
     */
    public function previewFile(string $fileId): Response|JsonResponse
    {
        $file = DriveFile::findOrFail($fileId);

        if (!Storage::disk('local')->exists($file->storage_path)) {
            return response()->json(['message' => 'File not found on disk.'], 404);
        }

        $fullPath = Storage::disk('local')->path($file->storage_path);
        $mimeType = $file->mime_type ?: 'application/octet-stream';

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . addslashes($file->original_name) . '"',
            'Cache-Control' => 'private, max-age=3600',
        ];

        return response()->file($fullPath, $headers);
    }

    /**
     * Bulk download multiple files as a ZIP archive.
     * POST /api/drive/{type}/{prospectId}/bulk-download
     */
    public function bulkDownload(Request $request, string $type, string $prospectId): StreamedResponse|JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $request->validate([
            'file_ids' => 'required|array|min:1|max:100',
            'file_ids.*' => 'required|uuid',
        ]);

        $files = DriveFile::forProspect($type, $prospectId)
            ->whereIn('id', $request->file_ids)
            ->get();

        if ($files->isEmpty()) {
            return response()->json(['message' => 'No files found.'], 404);
        }

        $zipPath = storage_path('app/temp/bulk_' . Str::uuid() . '.zip');
        $zipDir = dirname($zipPath);
        if (!is_dir($zipDir)) {
            mkdir($zipDir, 0755, true);
        }

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return response()->json(['message' => 'Failed to create archive.'], 500);
        }

        $usedNames = [];
        foreach ($files as $file) {
            $diskPath = Storage::disk('local')->path($file->storage_path);
            if (!file_exists($diskPath)) continue;

            // Deduplicate filenames
            $name = $file->original_name;
            if (isset($usedNames[$name])) {
                $usedNames[$name]++;
                $ext = pathinfo($name, PATHINFO_EXTENSION);
                $base = pathinfo($name, PATHINFO_FILENAME);
                $name = "{$base} ({$usedNames[$name]})" . ($ext ? ".{$ext}" : '');
            } else {
                $usedNames[$name] = 0;
            }

            $zip->addFile($diskPath, $name);
        }

        $zip->close();

        return response()->streamDownload(function () use ($zipPath) {
            readfile($zipPath);
            @unlink($zipPath); // Clean up temp file
        }, 'flowdrive-download.zip', [
            'Content-Type' => 'application/zip',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VERSION CONTROL
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Replace a file with a new version.
     * POST /api/drive/file/{fileId}/replace
     */
    public function replaceFile(Request $request, string $fileId): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:102400',
        ]);

        $file = DriveFile::findOrFail($fileId);
        $uploadedFile = $request->file('file');

        if ($uploadedFile->getSize() === 0) {
            return response()->json(['message' => 'Cannot upload empty file.'], 422);
        }

        $newVersion = $file->version + 1;
        $extension = $uploadedFile->getClientOriginalExtension();
        $storageName = $file->id . "_v{$newVersion}" . ($extension ? ".{$extension}" : '');
        $storagePath = dirname($file->storage_path) . "/{$storageName}";

        // Store the new version
        Storage::disk('local')->put($storagePath, file_get_contents($uploadedFile->getRealPath()));

        // Create version record
        DriveFileVersion::create([
            'file_id' => $file->id,
            'version_number' => $newVersion,
            'storage_path' => $storagePath,
            'size' => $uploadedFile->getSize(),
            'mime_type' => $uploadedFile->getMimeType(),
            'uploaded_by' => $request->user()->id,
        ]);

        // Update the main file record to point to new version
        $file->update([
            'storage_path' => $storagePath,
            'size' => $uploadedFile->getSize(),
            'mime_type' => $uploadedFile->getMimeType(),
            'version' => $newVersion,
        ]);

        $file->load('uploader:id,name');

        return response()->json([
            'message' => "File updated to version {$newVersion}.",
            'file' => $file,
        ]);
    }

    /**
     * List version history for a file.
     * GET /api/drive/file/{fileId}/versions
     */
    public function listVersions(string $fileId): JsonResponse
    {
        $file = DriveFile::findOrFail($fileId);
        $versions = $file->versions()->with('uploader:id,name')->get();

        return response()->json([
            'file' => [
                'id' => $file->id,
                'original_name' => $file->original_name,
                'current_version' => $file->version,
            ],
            'versions' => $versions,
        ]);
    }

    /**
     * Download a specific version.
     * GET /api/drive/file/{fileId}/versions/{versionId}/download
     */
    public function downloadVersion(string $fileId, string $versionId): StreamedResponse|JsonResponse
    {
        $file = DriveFile::findOrFail($fileId);
        $version = DriveFileVersion::where('file_id', $fileId)->findOrFail($versionId);

        if (!Storage::disk('local')->exists($version->storage_path)) {
            return response()->json(['message' => 'Version file not found on disk.'], 404);
        }

        $downloadName = pathinfo($file->original_name, PATHINFO_FILENAME)
            . "_v{$version->version_number}."
            . pathinfo($file->original_name, PATHINFO_EXTENSION);

        return Storage::disk('local')->download($version->storage_path, $downloadName);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COMMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Add a comment to a file.
     * POST /api/drive/file/{fileId}/comment
     */
    public function addComment(Request $request, string $fileId): JsonResponse
    {
        $request->validate(['content' => 'required|string|max:2000']);

        DriveFile::findOrFail($fileId);

        $comment = DriveComment::create([
            'file_id' => $fileId,
            'content' => $request->content,
            'user_id' => $request->user()->id,
        ]);

        $comment->load('user:id,name');

        return response()->json($comment, 201);
    }

    /**
     * List comments for a file.
     * GET /api/drive/file/{fileId}/comments
     */
    public function listComments(string $fileId): JsonResponse
    {
        DriveFile::findOrFail($fileId);

        $comments = DriveComment::where('file_id', $fileId)
            ->with('user:id,name')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id'         => $comment->id,
                    'content'    => $comment->content,
                    'user_name'  => $comment->user?->name ?? 'Unknown',
                    'created_at' => $comment->created_at,
                ];
            });

        return response()->json(['comments' => $comments]);
    }

    /**
     * Delete own comment.
     * DELETE /api/drive/comment/{commentId}
     */
    public function deleteComment(Request $request, string $commentId): JsonResponse
    {
        $comment = DriveComment::findOrFail($commentId);

        // Only comment owner or admin can delete
        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'You can only delete your own comments.'], 403);
        }

        $comment->delete();
        return response()->json(['message' => 'Comment deleted.']);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHARING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Create a share link for a file or folder.
     * POST /api/drive/share
     */
    public function createShare(Request $request): JsonResponse
    {
        $request->validate([
            'file_id' => 'nullable|uuid',
            'folder_id' => 'nullable|uuid',
            'password' => 'nullable|string|min:4|max:100',
            'expires_at' => 'nullable|date|after:now',
            'max_access_count' => 'nullable|integer|min:1|max:10000',
            'allow_download' => 'nullable|boolean',
        ]);

        if (!$request->file_id && !$request->folder_id) {
            return response()->json(['message' => 'Either file_id or folder_id is required.'], 422);
        }

        // Verify item exists
        if ($request->file_id) {
            DriveFile::findOrFail($request->file_id);
        }
        if ($request->folder_id) {
            DriveFolder::findOrFail($request->folder_id);
        }

        $share = DriveShare::create([
            'file_id' => $request->file_id,
            'folder_id' => $request->folder_id,
            'password_hash' => $request->password ? Hash::make($request->password) : null,
            'expires_at' => $request->expires_at,
            'max_access_count' => $request->max_access_count,
            'allow_download' => $request->has('allow_download') ? (bool) $request->allow_download : true,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'share' => $share,
            'share_url' => url("/shared/{$share->share_token}"),
        ], 201);
    }

    /**
     * Revoke a share link.
     * DELETE /api/drive/share/{shareId}
     */
    public function revokeShare(string $shareId): JsonResponse
    {
        $share = DriveShare::findOrFail($shareId);
        $share->update(['is_active' => false]);
        return response()->json(['message' => 'Share link revoked.']);
    }

    /**
     * List active shares for a file or folder.
     * GET /api/drive/file/{fileId}/shares
     */
    public function listShares(string $fileId): JsonResponse
    {
        $file = DriveFile::findOrFail($fileId);
        $shares = $file->shares()
            ->where('is_active', true)
            ->with('creator:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($share) {
                $share->share_url = url("/shared/{$share->share_token}");
                return $share;
            });

        return response()->json($shares);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC SHARE ACCESS (No Auth Required)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Access shared content — returns metadata and whether password is required.
     * GET /api/drive/shared/{token}
     */
    public function accessShared(string $token): JsonResponse
    {
        $share = DriveShare::where('share_token', $token)->first();

        if (!$share) {
            return response()->json(['message' => 'Share link not found.'], 404);
        }

        if (!$share->is_active) {
            return response()->json(['message' => 'This share link has been revoked.'], 410);
        }

        if ($share->isExpired()) {
            return response()->json(['message' => 'This share link has expired.'], 410);
        }

        if ($share->isAccessLimitReached()) {
            return response()->json(['message' => 'This share link has reached its access limit.'], 410);
        }

        if ($share->requiresPassword()) {
            $name = $share->file_id
                ? optional($share->file)->original_name
                : optional($share->folder)->name;
            return response()->json([
                'requires_password' => true,
                'type' => $share->file_id ? 'file' : 'folder',
                'name' => $name ?? 'Shared Content',
            ]);
        }

        // No password — return content info
        $share->incrementAccessCount();
        return $this->getSharedContent($share);
    }

    /**
     * Verify share password.
     * POST /api/drive/shared/{token}/verify
     */
    public function verifySharePassword(Request $request, string $token): JsonResponse
    {
        // Rate limiting: 5 attempts per 15 minutes per IP
        $rateLimitKey = 'share_password:' . $request->ip() . ':' . $token;
        $attempts = Cache::get($rateLimitKey, 0);

        if ($attempts >= 5) {
            $ttl = Cache::get($rateLimitKey . ':ttl', 0);
            return response()->json([
                'message' => 'Too many attempts. Please try again later.',
                'retry_after' => max(0, $ttl - time()),
            ], 429);
        }

        $request->validate(['password' => 'required|string']);

        $share = DriveShare::where('share_token', $token)->first();

        if (!$share || !$share->isValid()) {
            return response()->json(['message' => 'Share link not found or expired.'], 404);
        }

        if (!$share->verifyPassword($request->password)) {
            // Increment rate limiter
            Cache::put($rateLimitKey, $attempts + 1, now()->addMinutes(15));
            Cache::put($rateLimitKey . ':ttl', now()->addMinutes(15)->timestamp, now()->addMinutes(15));
            return response()->json(['message' => 'Incorrect password.'], 403);
        }

        // Password correct — clear rate limiter and set verified session
        Cache::forget($rateLimitKey);
        Cache::forget($rateLimitKey . ':ttl');

        // Store verified status so download/preview endpoints can check it
        $sessionKey = 'share_verified:' . $token . ':' . $request->ip();
        Cache::put($sessionKey, true, now()->addHours(1));

        $share->incrementAccessCount();
        return $this->getSharedContent($share);
    }

    /**
     * Download a shared file.
     * GET /api/drive/shared/{token}/download
     */
    public function downloadShared(Request $request, string $token): StreamedResponse|JsonResponse
    {
        $share = DriveShare::where('share_token', $token)->first();

        if (!$share || !$share->isValid() || !$share->file_id) {
            return response()->json(['message' => 'Share link not found or expired.'], 404);
        }

        // Check download permission
        if (!$share->allow_download) {
            return response()->json(['message' => 'Download is not allowed for this share.'], 403);
        }

        // Check password if required
        if ($share->requiresPassword()) {
            $sessionKey = 'share_verified:' . $token . ':' . $request->ip();
            if (!Cache::get($sessionKey)) {
                return response()->json(['message' => 'Password verification required.'], 403);
            }
        }

        $file = $share->file;
        if (!$file || !Storage::disk('local')->exists($file->storage_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return Storage::disk('local')->download($file->storage_path, $file->original_name);
    }

    /**
     * Preview a shared file inline (no download).
     * GET /api/drive/shared/{token}/preview
     */
    public function previewShared(Request $request, string $token): Response|JsonResponse
    {
        $share = DriveShare::where('share_token', $token)->first();

        if (!$share || !$share->isValid() || !$share->file_id) {
            return response()->json(['message' => 'Share link not found or expired.'], 404);
        }

        // Check password if required
        if ($share->requiresPassword()) {
            $sessionKey = 'share_verified:' . $token . ':' . $request->ip();
            if (!Cache::get($sessionKey)) {
                return response()->json(['message' => 'Password verification required.'], 403);
            }
        }

        $file = $share->file;
        if (!$file || !Storage::disk('local')->exists($file->storage_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $fullPath = Storage::disk('local')->path($file->storage_path);
        $mimeType = $file->mime_type ?: 'application/octet-stream';

        return response()->file($fullPath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . addslashes($file->original_name) . '"',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /**
     * Resolve share location for logged-in users.
     * GET /api/drive/shared/{token}/resolve  (auth required)
     */
    public function resolveShareLocation(string $token): JsonResponse
    {
        $share = DriveShare::where('share_token', $token)->first();

        if (!$share || !$share->isValid()) {
            return response()->json(['message' => 'Share link not found or expired.'], 404);
        }

        if ($share->file_id) {
            $file = $share->file;
            if (!$file) {
                return response()->json(['message' => 'File not found.'], 404);
            }

            return response()->json([
                'type' => 'file',
                'prospect_type' => $file->prospect_type,
                'prospect_id' => $file->prospect_id,
                'folder_id' => $file->folder_id,
                'file_id' => $file->id,
            ]);
        }

        if ($share->folder_id) {
            $folder = $share->folder;
            if (!$folder) {
                return response()->json(['message' => 'Folder not found.'], 404);
            }

            return response()->json([
                'type' => 'folder',
                'prospect_type' => $folder->prospect_type,
                'prospect_id' => $folder->prospect_id,
                'folder_id' => $folder->id,
            ]);
        }

        return response()->json(['message' => 'Shared content not found.'], 404);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MOVE / REORGANIZE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Bulk move files and/or folders to a different folder (or root).
     * POST /api/drive/{type}/{prospectId}/move
     */
    public function bulkMove(Request $request, string $type, string $prospectId): JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $request->validate([
            'file_ids'         => 'array',
            'file_ids.*'       => 'string|uuid',
            'folder_ids'       => 'array',
            'folder_ids.*'     => 'string|uuid',
            'target_folder_id' => 'nullable|string',
        ]);

        $targetId = $request->input('target_folder_id');

        // Validate target folder belongs to the same prospect (if not root)
        if ($targetId) {
            DriveFolder::where('id', $targetId)
                ->where('prospect_type', $type)
                ->where('prospect_id', $prospectId)
                ->firstOrFail();
        }

        // Circular-move guard for folders
        foreach ($request->input('folder_ids', []) as $fid) {
            if ($fid === $targetId) {
                return response()->json(['message' => 'Cannot move a folder into itself.'], 422);
            }
            // Walk up the target's ancestors to check for circular reference
            if ($targetId) {
                $ancestor = DriveFolder::find($targetId);
                while ($ancestor) {
                    if ($ancestor->id === $fid) {
                        return response()->json([
                            'message' => 'Cannot move a folder into one of its own subfolders.'
                        ], 422);
                    }
                    $ancestor = $ancestor->parent;
                }
            }
        }

        // Move files
        $movedFiles = DriveFile::whereIn('id', $request->input('file_ids', []))
            ->where('prospect_type', $type)
            ->where('prospect_id', $prospectId)
            ->update(['folder_id' => $targetId]);

        // Move folders
        $movedFolders = DriveFolder::whereIn('id', $request->input('folder_ids', []))
            ->where('prospect_type', $type)
            ->where('prospect_id', $prospectId)
            ->update(['parent_id' => $targetId]);

        return response()->json([
            'message'       => 'Moved successfully.',
            'moved_files'   => $movedFiles,
            'moved_folders' => $movedFolders,
        ]);
    }

    /**
     * Get the full folder tree for a prospect (flat list — frontend builds hierarchy).
     * GET /api/drive/{type}/{prospectId}/folder-tree
     */
    public function folderTree(string $type, string $prospectId): JsonResponse
    {
        $type = $this->resolveType($type);
        $prospectId = $this->resolveProspectId($type, $prospectId);

        $folders = DriveFolder::where('prospect_type', $type)
            ->where('prospect_id', $prospectId)
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);

        return response()->json(['folders' => $folders]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Normalize prospect type: 'investor' → 'investor', 'target' → 'target'
     */
    private function resolveType(string $type): string
    {
        $type = strtolower($type);
        if (!in_array($type, ['investor', 'target', 'partner'])) {
            abort(422, 'Invalid prospect type. Must be "investor", "target", or "partner".');
        }
        return $type;
    }

    /**
     * Resolve prospect ID from either numeric DB ID or project code.
     * Handles edge cases: numeric strings, non-existent codes, empty values.
     */
    private function resolveProspectId(string $type, string $prospectId): int
    {
        // Already a numeric ID — validate it exists
        if (is_numeric($prospectId)) {
            $id = (int) $prospectId;
            if ($type === 'investor') {
                \App\Models\Investor::where('id', $id)->firstOrFail();
            } elseif ($type === 'target') {
                \App\Models\Target::where('id', $id)->firstOrFail();
            } else {
                \App\Models\Partner::where('id', $id)->firstOrFail();
            }
            return $id;
        }

        // Project code resolution
        if ($type === 'investor') {
            $record = \App\Models\Investor::where('buyer_id', $prospectId)->first();
        } elseif ($type === 'target') {
            $record = \App\Models\Target::where('seller_id', $prospectId)->first();
        } else {
            $record = \App\Models\Partner::where('partner_id', $prospectId)->first();
        }

        if (!$record) {
            abort(404, 'Prospect not found for the given project code.');
        }

        return $record->id;
    }

    /**
     * Sanitize a filename or folder name — remove path traversal characters.
     */
    private function sanitizeName(string $name): string
    {
        // Strip null bytes and directory traversal
        $name = str_replace(['..', "\0", '/', '\\'], '', $name);
        // Trim whitespace
        $name = trim($name);
        // Limit length
        return Str::limit($name, 255, '');
    }

    /**
     * Build breadcrumb trail from folder up to root.
     */
    private function buildBreadcrumbs(DriveFolder $folder): array
    {
        $breadcrumbs = [];
        $current = $folder;

        while ($current) {
            array_unshift($breadcrumbs, [
                'id' => $current->id,
                'name' => $current->name,
            ]);
            $current = $current->parent;
        }

        return $breadcrumbs;
    }

    /**
     * Count all files nested under a folder (recursively).
     */
    private function countNestedFiles(DriveFolder $folder): int
    {
        $count = $folder->files()->count();
        foreach ($folder->children as $child) {
            $count += $this->countNestedFiles($child);
        }
        return $count;
    }

    /**
     * Count all subfolders nested under a folder (recursively).
     */
    private function countNestedFolders(DriveFolder $folder): int
    {
        $count = $folder->children()->count();
        foreach ($folder->children as $child) {
            $count += $this->countNestedFolders($child);
        }
        return $count;
    }

    /**
     * Delete physical files for a folder and all nested contents.
     */
    private function deletePhysicalFiles(DriveFolder $folder): void
    {
        // Delete files in this folder
        foreach ($folder->files as $file) {
            // Delete all version files
            foreach ($file->versions as $version) {
                if (Storage::disk('local')->exists($version->storage_path)) {
                    Storage::disk('local')->delete($version->storage_path);
                }
            }
            // Delete current file
            if (Storage::disk('local')->exists($file->storage_path)) {
                Storage::disk('local')->delete($file->storage_path);
            }
        }

        // Recurse into subfolders
        foreach ($folder->children as $child) {
            $this->deletePhysicalFiles($child);
        }
    }

    /**
     * Get shared content metadata for response.
     */
    private function getSharedContent(DriveShare $share): JsonResponse
    {
        if ($share->file_id) {
            $file = $share->file;

            // Get accurate file size — prefer storage, fallback to DB
            $fileSize = $file->size;
            if ($file->storage_path && Storage::disk('local')->exists($file->storage_path)) {
                $fileSize = Storage::disk('local')->size($file->storage_path);
            }

            return response()->json([
                'type' => 'file',
                'allow_download' => (bool) $share->allow_download,
                'file' => [
                    'id' => $file->id,
                    'name' => $file->original_name,
                    'mime_type' => $file->mime_type,
                    'size' => $fileSize,
                    'is_previewable' => $file->isPreviewable(),
                    'preview_url' => url("/api/drive/shared/{$share->share_token}/preview"),
                    'download_url' => url("/api/drive/shared/{$share->share_token}/download"),
                ],
            ]);
        }

        if ($share->folder_id) {
            $folder = $share->folder;
            $files = $folder->files()->select('id', 'original_name', 'mime_type', 'size', 'created_at')->get();
            $subfolders = $folder->children()->select('id', 'name', 'created_at')->get();

            return response()->json([
                'type' => 'folder',
                'allow_download' => (bool) $share->allow_download,
                'folder' => [
                    'id' => $folder->id,
                    'name' => $folder->name,
                ],
                'files' => $files,
                'subfolders' => $subfolders,
            ]);
        }

        return response()->json(['message' => 'Shared content not found.'], 404);
    }
}
