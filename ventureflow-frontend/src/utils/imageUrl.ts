/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 *
 * Centralized image URL builder for files served via /api/files/{path}
 * Works in both dev (localhost:8000) and production (same-origin).
 */

/**
 * Build image URL for files stored in Laravel's public storage disk.
 * Returns null if no image path is provided.
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) return null;

    // If it's already a full URL (http/https), return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // Strip leading slash if present
    const cleanPath = imagePath.replace(/^\//, '');

    // Always use absolute path — works for both dev and production
    return `/api/files/${cleanPath}`;
}

/**
 * Get a UI Avatars fallback URL with initials.
 * Used when no profile image is available.
 */
export function getInitialsUrl(name: string, bg = '064771', color = 'fff'): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${color}`;
}
