<?php
/**
 * Migration & Cache Runner — Access via: https://ventureflow.app/test.php
 * DELETE AFTER USE
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('max_execution_time', 120);
header('Content-Type: text/plain; charset=utf-8');

$root = dirname(__FILE__) . '/..';

echo "=== VentureFlow Post-Deploy Runner ===\n\n";

if (!file_exists("$root/vendor/autoload.php")) {
    echo "ERROR: vendor/autoload.php not found!\n";
    exit(1);
}

try {
    require "$root/vendor/autoload.php";
    $app = require_once "$root/bootstrap/app.php";
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    echo "Laravel booted successfully.\n\n";

    // Step 1: Clear all caches
    echo "=== Step 1: Clearing caches ===\n";
    Illuminate\Support\Facades\Artisan::call('config:clear');
    echo "  config:clear ✅\n";
    Illuminate\Support\Facades\Artisan::call('route:clear');
    echo "  route:clear ✅\n";
    Illuminate\Support\Facades\Artisan::call('view:clear');
    echo "  view:clear ✅\n";
    try {
        Illuminate\Support\Facades\Artisan::call('cache:clear');
        echo "  cache:clear ✅\n";
    } catch (Exception $e) {
        echo "  cache:clear skipped: " . $e->getMessage() . "\n";
    }

    // Step 2: Run pending migrations
    echo "\n=== Step 2: Running migrations ===\n";
    $exitCode = Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    $output = Illuminate\Support\Facades\Artisan::output();
    echo $output;
    echo "Migration exit code: $exitCode\n";

    // Step 3: Verify critical tables
    echo "\n=== Step 3: Verification ===\n";
    $tables = ['deal_comment_reads', 'deals', 'buyers', 'sellers', 'activity_logs'];
    foreach ($tables as $table) {
        $exists = Illuminate\Support\Facades\Schema::hasTable($table);
        echo "  Table '$table': " . ($exists ? 'YES ✅' : 'NO ❌') . "\n";
    }

    // Step 4: Quick API test — check if /api/deals works
    echo "\n=== Step 4: Quick DB test ===\n";
    try {
        $dealCount = DB::table('deals')->count();
        echo "  Deals count: $dealCount\n";
        $buyerCount = DB::table('buyers')->count();
        echo "  Buyers count: $buyerCount\n";
        $sellerCount = DB::table('sellers')->count();
        echo "  Sellers count: $sellerCount\n";
        $commentReadsCount = DB::table('deal_comment_reads')->count();
        echo "  DealCommentReads count: $commentReadsCount\n";
    } catch (Exception $e) {
        echo "  DB test error: " . $e->getMessage() . "\n";
    }

    // Step 5: Check last error in logs
    echo "\n=== Step 5: Last log entries ===\n";
    $logFile = "$root/storage/logs/laravel.log";
    if (file_exists($logFile)) {
        $size = filesize($logFile);
        echo "  Log size: " . round($size / 1024) . " KB\n";
        $lastLines = array_slice(explode("\n", file_get_contents($logFile)), -10);
        foreach ($lastLines as $line) {
            echo "  $line\n";
        }
    } else {
        echo "  No log file found.\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=== Done ===\n";
echo "\n⚠️  DELETE THIS FILE from server after use!\n";
