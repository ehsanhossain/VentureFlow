<?php
/**
 * Server Diagnostic Tool — DELETE AFTER USE
 * Access via: https://ventureflow.app/diagnose.php
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain; charset=utf-8');

$root = dirname(__FILE__) . '/..';
echo "=== VentureFlow Server Diagnostic ===\n\n";

// 1. PHP Info
echo "1. PHP Version: " . PHP_VERSION . "\n";
echo "   upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "   post_max_size: " . ini_get('post_max_size') . "\n";
echo "   max_file_uploads: " . ini_get('max_file_uploads') . "\n";

// 2. Check .env
echo "\n2. .env exists: " . (file_exists("$root/.env") ? 'YES' : 'NO') . "\n";
echo "   vendor/autoload.php: " . (file_exists("$root/vendor/autoload.php") ? 'YES' : 'NO') . "\n";

// 3. Boot Laravel
if (file_exists("$root/vendor/autoload.php")) {
    try {
        require "$root/vendor/autoload.php";
        $app = require_once "$root/bootstrap/app.php";
        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();
        echo "\n3. Laravel booted: YES\n";

        // 4. Config Values
        echo "\n4. Config values:\n";
        echo "   APP_URL: " . config('app.url') . "\n";
        echo "   APP_ENV: " . config('app.env') . "\n";
        echo "   APP_KEY: " . (config('app.key') ? 'SET ✅' : 'MISSING ❌') . "\n";
        echo "   DB_CONNECTION: " . config('database.default') . "\n";
        echo "   DB_DATABASE: " . config('database.connections.' . config('database.default') . '.database') . "\n";
        echo "   SESSION_DRIVER: " . config('session.driver') . "\n";
        echo "   SESSION_DOMAIN: " . config('session.domain') . "\n";
        echo "   SANCTUM_STATEFUL: " . implode(', ', config('sanctum.stateful', [])) . "\n";
        echo "   FRONTEND_URL: " . config('app.frontend_url', env('FRONTEND_URL')) . "\n";

        // 5. Database
        try {
            $pdo = DB::connection()->getPdo();
            $dbName = DB::connection()->getDatabaseName();
            echo "\n5. Database connected: YES ($dbName)\n";

            $tables = DB::select("SHOW TABLES");
            $tableNames = array_map(fn($t) => array_values((array)$t)[0], $tables);
            echo "   Tables: " . count($tableNames) . "\n";
            echo "   Has sessions: " . (in_array('sessions', $tableNames) ? 'YES' : 'NO') . "\n";
            echo "   Has users: " . (in_array('users', $tableNames) ? 'YES' : 'NO') . "\n";
            echo "   Has employees: " . (in_array('employees', $tableNames) ? 'YES' : 'NO') . "\n";

            // Count users
            $userCount = DB::table('users')->count();
            echo "   User count: $userCount\n";
        } catch (Exception $e) {
            echo "\n5. Database: ERROR - " . $e->getMessage() . "\n";
        }

        // 6. Storage check
        echo "\n6. Storage:\n";
        $storagePath = storage_path('app/public');
        echo "   storage/app/public exists: " . (is_dir($storagePath) ? 'YES' : 'NO') . "\n";
        echo "   storage/app/public writable: " . (is_writable($storagePath) ? 'YES ✅' : 'NO ❌') . "\n";

        // Test write
        $testFile = $storagePath . '/test_write.tmp';
        $writeOk = @file_put_contents($testFile, 'test');
        echo "   Can write files: " . ($writeOk !== false ? 'YES ✅' : 'NO ❌') . "\n";
        if ($writeOk !== false) @unlink($testFile);

        // Check symlink
        $symlinkPath = public_path('storage');
        echo "   public/storage symlink: " . (is_link($symlinkPath) ? 'YES' : (is_dir($symlinkPath) ? 'DIR (not symlink)' : 'NO')) . "\n";

        // Check employees dir
        $empDir = $storagePath . '/employees';
        echo "   storage/app/public/employees: " . (is_dir($empDir) ? 'YES (' . count(glob("$empDir/*")) . ' files)' : 'NO') . "\n";

    } catch (Exception $e) {
        echo "\n3. Laravel boot FAILED: " . $e->getMessage() . "\n";
    }
} else {
    echo "\n3. Cannot boot — vendor/autoload.php missing!\n";
}

// 7. Last error log
$logFile = "$root/storage/logs/laravel.log";
if (file_exists($logFile)) {
    $size = filesize($logFile);
    echo "\n7. Laravel log: " . round($size / 1024) . " KB\n";
    $lastLines = array_slice(explode("\n", file_get_contents($logFile)), -15);
    echo "   Last 15 lines:\n";
    foreach ($lastLines as $line) {
        echo "   $line\n";
    }
}

echo "\n=== Done ===\n";
