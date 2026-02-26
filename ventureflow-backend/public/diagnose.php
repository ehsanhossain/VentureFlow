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

// 1. Check PHP version
echo "1. PHP Version: " . PHP_VERSION . "\n";

// 2. Check .env exists
$envPath = "$root/.env";
echo "2. .env exists: " . (file_exists($envPath) ? 'YES' : 'NO') . "\n";

// 3. Check vendor/autoload
echo "3. vendor/autoload.php: " . (file_exists("$root/vendor/autoload.php") ? 'YES' : 'NO') . "\n\n";

// 4. Try to boot Laravel and check DB
if (file_exists("$root/vendor/autoload.php")) {
    try {
        require "$root/vendor/autoload.php";
        $app = require_once "$root/bootstrap/app.php";
        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();
        echo "4. Laravel booted: YES\n";

        // 5. Check DB connection
        try {
            $pdo = DB::connection()->getPdo();
            echo "5. Database connected: YES (" . DB::connection()->getDatabaseName() . ")\n";
        } catch (Exception $e) {
            echo "5. Database connected: NO\n";
            echo "   Error: " . $e->getMessage() . "\n";
        }

        // 6. Check if sessions table exists
        try {
            $tables = DB::select("SHOW TABLES");
            $tableNames = array_map(function($t) {
                return array_values((array)$t)[0];
            }, $tables);
            echo "6. Tables in DB: " . count($tableNames) . "\n";
            echo "   sessions table: " . (in_array('sessions', $tableNames) ? 'YES' : 'NO ⚠️ THIS IS THE PROBLEM') . "\n";
            echo "   cache table: " . (in_array('cache', $tableNames) ? 'YES' : 'NO') . "\n";
            echo "   users table: " . (in_array('users', $tableNames) ? 'YES' : 'NO') . "\n";
            echo "   password_reset_tokens: " . (in_array('password_reset_tokens', $tableNames) ? 'YES' : 'NO') . "\n";
            echo "\n   All tables: " . implode(', ', $tableNames) . "\n";
        } catch (Exception $e) {
            echo "6. Tables check failed: " . $e->getMessage() . "\n";
        }

        // 7. Check key config values
        echo "\n7. Config values:\n";
        echo "   APP_URL: " . config('app.url') . "\n";
        echo "   APP_ENV: " . config('app.env') . "\n";
        echo "   APP_DEBUG: " . (config('app.debug') ? 'true' : 'false') . "\n";
        echo "   SESSION_DRIVER: " . config('session.driver') . "\n";
        echo "   SESSION_DOMAIN: " . config('session.domain') . "\n";
        echo "   SANCTUM_STATEFUL: " . implode(', ', config('sanctum.stateful', [])) . "\n";
        echo "   CACHE_STORE: " . config('cache.default') . "\n";

        // 8. Check storage permissions
        echo "\n8. Permissions:\n";
        echo "   storage/ writable: " . (is_writable("$root/storage") ? 'YES' : 'NO ⚠️') . "\n";
        echo "   storage/logs/ writable: " . (is_writable("$root/storage/logs") ? 'YES' : 'NO ⚠️') . "\n";
        echo "   bootstrap/cache/ writable: " . (is_writable("$root/bootstrap/cache") ? 'YES' : 'NO ⚠️') . "\n";

        // 9. Check Laravel error log
        $logFile = "$root/storage/logs/laravel.log";
        if (file_exists($logFile)) {
            $logContent = file_get_contents($logFile);
            $lastLines = implode("\n", array_slice(explode("\n", $logContent), -30));
            echo "\n9. Last 30 lines of laravel.log:\n";
            echo $lastLines . "\n";
        } else {
            echo "\n9. No laravel.log found\n";
        }

    } catch (Exception $e) {
        echo "4. Laravel boot FAILED: " . $e->getMessage() . "\n";
    }
} else {
    echo "4. Cannot boot Laravel — vendor/autoload.php missing!\n";
    echo "   Run test.php first to install composer dependencies.\n";
}

echo "\n=== Done ===\n";
