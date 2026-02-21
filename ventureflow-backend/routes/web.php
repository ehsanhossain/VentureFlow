<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return [
        'app' => env('APP_NAME', 'VentureFlow'),
        'version' => env('APP_VERSION', '1.0.0'),
        'laravel' => app()->version(),
    ];
});

require __DIR__.'/auth.php';
