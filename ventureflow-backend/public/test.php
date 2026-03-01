<?php
/**
 * Migration Runner — Access via: https://ventureflow.app/test.php
 * DELETE AFTER USE
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain; charset=utf-8');

$root = dirname(__FILE__) . '/..';

echo "=== VentureFlow Migration Runner ===\n\n";

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

    // Check if deal_comment_reads table already exists
    $tableExists = Illuminate\Support\Facades\Schema::hasTable('deal_comment_reads');
    echo "Table 'deal_comment_reads' exists: " . ($tableExists ? 'YES' : 'NO') . "\n\n";

    if ($tableExists) {
        echo "Migration already applied! Nothing to do.\n";
    } else {
        echo "Running: php artisan migrate --force\n";
        echo str_repeat('-', 50) . "\n";

        $exitCode = Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $output = Illuminate\Support\Facades\Artisan::output();

        echo $output;
        echo str_repeat('-', 50) . "\n";
        echo "Exit code: $exitCode\n";

        // Verify
        $tableNow = Illuminate\Support\Facades\Schema::hasTable('deal_comment_reads');
        echo "\nVerification - 'deal_comment_reads' exists now: " . ($tableNow ? 'YES ✅' : 'NO ❌') . "\n";
    }

    // Also clear caches to be safe
    echo "\nClearing caches...\n";
    Illuminate\Support\Facades\Artisan::call('config:clear');
    echo "  config:clear ✅\n";
    Illuminate\Support\Facades\Artisan::call('route:clear');
    echo "  route:clear ✅\n";
    Illuminate\Support\Facades\Artisan::call('view:clear');
    echo "  view:clear ✅\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Done ===\n";
echo "\n⚠️  DELETE THIS FILE AFTER USE for security!\n";
