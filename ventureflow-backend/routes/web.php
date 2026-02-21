<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return [
        'app' => env('APP_NAME', 'Ventureflow'),
        'version' => env('APP_VERSION', '1.0.0'),
        'developer' => env('APP_DEVELOPER', 'Legacy Script'),
        'laravel' => app()->version(),
    ];
});

require __DIR__.'/auth.php';
