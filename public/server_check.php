<?php
/**
 * Server Diagnostic Script
 * Check common issues that cause HTTP 500 errors
 */
header('Content-Type: text/plain');
echo "=== VentureFlow Server Diagnostics ===\n\n";

// 1. Check current directory
$publicDir = __DIR__;
$rootDir = dirname(__DIR__);
echo "1. PATHS\n";
echo "   Public dir: $publicDir\n";
echo "   Laravel root: $rootDir\n";
echo "   artisan exists: " . (file_exists("$rootDir/artisan") ? 'YES' : 'NO') . "\n";
echo "   vendor exists: " . (is_dir("$rootDir/vendor") ? 'YES' : 'NO') . "\n";
echo "   vendor/autoload.php: " . (file_exists("$rootDir/vendor/autoload.php") ? 'YES' : 'NO') . "\n\n";

// 2. Check .env
echo "2. ENV FILE\n";
$envPath = "$rootDir/.env";
echo "   .env exists: " . (file_exists($envPath) ? 'YES' : 'NO') . "\n";
if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    $lines = explode("\n", $envContent);
    echo "   .env lines: " . count($lines) . "\n";
    echo "   First 3 chars of line 1: '" . substr(trim($lines[0]), 0, 20) . "'\n";
    // Check for leading whitespace
    if (preg_match('/^\s+/', $lines[0])) {
        echo "   WARNING: .env has leading whitespace!\n";
    }
    // Check key values
    foreach (['APP_KEY', 'DB_CONNECTION', 'DB_DATABASE', 'DB_HOST'] as $key) {
        preg_match("/^$key=(.*)$/m", $envContent, $m);
        echo "   $key=" . ($m[1] ?? 'NOT FOUND') . "\n";
    }
}
echo "\n";

// 3. Check permissions
echo "3. PERMISSIONS\n";
$dirs = [
    "$rootDir/storage",
    "$rootDir/storage/logs",
    "$rootDir/storage/framework",
    "$rootDir/storage/framework/cache",
    "$rootDir/storage/framework/sessions",
    "$rootDir/storage/framework/views",
    "$rootDir/bootstrap/cache",
];
foreach ($dirs as $dir) {
    $exists = is_dir($dir);
    $writable = $exists ? is_writable($dir) : false;
    $perms = $exists ? substr(sprintf('%o', fileperms($dir)), -4) : 'N/A';
    $baseName = str_replace($rootDir.'/', '', $dir);
    echo "   $baseName: " . ($exists ? "exists($perms)" : "MISSING") . " " . ($writable ? "writable" : "NOT WRITABLE") . "\n";
}
echo "\n";

// 4. Try to boot Laravel and catch error
echo "4. LARAVEL BOOT TEST\n";
try {
    chdir($rootDir);
    require "$rootDir/vendor/autoload.php";
    $app = require_once "$rootDir/bootstrap/app.php";
    $kernel = $app->make('Illuminate\Contracts\Console\Kernel');
    $kernel->bootstrap();
    echo "   Laravel booted successfully!\n";
    echo "   DB connection: " . config('database.default') . "\n";
    
    // Test DB
    try {
        $tables = \DB::select('SHOW TABLES');
        echo "   DB connected! Tables: " . count($tables) . "\n";
    } catch (\Exception $e) {
        echo "   DB ERROR: " . $e->getMessage() . "\n";
    }
} catch (\Throwable $e) {
    echo "   BOOT ERROR: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
echo "\n";

echo "=== Diagnostics Complete ===\n";
