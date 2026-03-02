<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class FileServeController extends Controller
{
    /**
     * Serve a file from the public storage disk.
     * This bypasses the need for symlinks (which Plesk blocks).
     *
     * Route: GET /api/files/{path}
     * Example: /api/files/employees/avatar.jpg
     */
    public function serve(string $path): Response
    {
        // Security: prevent directory traversal
        $path = str_replace(['..', "\0"], '', $path);

        if (!Storage::disk('public')->exists($path)) {
            abort(404, 'File not found.');
        }

        $fullPath = Storage::disk('public')->path($path);
        $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';

        return response()->file($fullPath, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
