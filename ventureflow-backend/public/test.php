<?php
/**
 * VentureFlow Production Deployment Helper
 * ⚠️ DELETE THIS FILE AFTER USE — contains privileged operations
 */
echo "<pre style='font-family: monospace; background: #1a1a2e; color: #e94560; padding: 20px; font-size: 13px;'>\n";
echo "======================================\n";
echo "  VentureFlow Deployment Helper\n";
echo "  " . date('Y-m-d H:i:s') . "\n";
echo "======================================\n\n";

$base = dirname(__DIR__);
chdir($base);
echo "Working in: $base\n\n";

// ── Step 0: Clear ALL caches ──
echo "=== Step 0: Clearing ALL caches ===\n";
foreach (['packages.php', 'services.php'] as $f) {
    $path = "$base/bootstrap/cache/$f";
    if (file_exists($path)) { unlink($path); echo "Deleted: $f\n"; }
}
$cacheCommands = [
    'php artisan config:clear',
    'php artisan cache:clear',
    'php artisan route:clear',
    'php artisan view:clear',
];
foreach ($cacheCommands as $cmd) {
    exec("cd $base && $cmd 2>&1", $out, $rc);
    echo ($rc === 0 ? "✅" : "❌") . " $cmd\n";
}

// ── Step 1: Storage directories ──
echo "\n=== Step 1: Creating storage directories ===\n";
$dirs = [
    '/storage/app/public', '/storage/app/public/employees',
    '/storage/app/public/partners', '/storage/app/public/sellers',
    '/storage/app/public/buyers', '/storage/app/public/email-assets',
    '/storage/framework/cache/data', '/storage/framework/sessions',
    '/storage/framework/views', '/storage/logs', '/bootstrap/cache',
];
foreach ($dirs as $d) {
    $full = $base . $d;
    if (!is_dir($full)) { mkdir($full, 0775, true); echo "Created: $d\n"; }
    else echo "Exists:  $d\n";
}

// ── Step 2: Fix permissions ──
echo "\n=== Step 2: Fixing permissions ===\n";
exec("chmod -R 775 $base/storage $base/bootstrap/cache 2>&1");
echo "storage writable: " . (is_writable("$base/storage") ? "YES ✅" : "NO ❌") . "\n";

// ── Step 3: Check .env ──
echo "\n=== Step 3: Checking .env ===\n";
$envPath = "$base/.env";
if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    $keys = ['APP_ENV', 'APP_URL', 'SANCTUM_STATEFUL_DOMAINS', 'FRONTEND_URL', 'DB_CONNECTION', 'DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'SESSION_DRIVER', 'SESSION_DOMAIN'];
    foreach ($keys as $k) {
        if (preg_match("/^{$k}=(.*)$/m", $envContent, $m)) {
            echo "  $k=" . trim($m[1]) . "\n";
        }
    }
} else {
    echo "❌ .env file NOT FOUND!\n";
}

// ── Step 4: Composer check ──
echo "\n=== Step 4: Composer autoload ===\n";
if (file_exists("$base/vendor/autoload.php")) {
    echo "Composer already exists ✅\n";
} else {
    echo "❌ vendor/autoload.php missing! Run: composer install --no-dev\n";
}

// ── Step 5: Run migrations ──
echo "\n=== Step 5: Running database migrations ===\n";
exec("cd $base && php artisan migrate --force 2>&1", $migOut, $migRc);
echo implode("\n", $migOut) . "\n";
echo ($migRc === 0 ? "✅ Migrations completed" : "❌ Migration failed (exit code: $migRc)") . "\n";

// ── Step 6: Verify new deal columns ──
echo "\n=== Step 6: Verifying deal table columns ===\n";
try {
    require_once "$base/vendor/autoload.php";
    $app = require_once "$base/bootstrap/app.php";
    $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    $columns = \Illuminate\Support\Facades\Schema::getColumnListing('deals');
    $required = ['investment_condition', 'ebitda_investor_value', 'ebitda_investor_times', 'ebitda_target_value', 'ebitda_target_times', 'deal_type', 'pipeline_type', 'ticket_size'];
    foreach ($required as $col) {
        $exists = in_array($col, $columns);
        echo ($exists ? "✅" : "❌") . " Column '$col' " . ($exists ? "exists" : "MISSING") . "\n";
    }

    // Quick deal count
    $dealCount = \App\Models\Deal::count();
    echo "\nTotal deals in DB: $dealCount\n";

    // Quick stage count
    $stageCount = \App\Models\PipelineStage::where('is_active', true)->count();
    echo "Active pipeline stages: $stageCount\n";

} catch (\Exception $e) {
    echo "❌ Verification failed: " . $e->getMessage() . "\n";
}

// ── Step 7: Rebuild caches ──
echo "\n=== Step 7: Rebuilding caches ===\n";
$rebuildCmds = [
    'php artisan config:cache',
    'php artisan route:cache',
];
foreach ($rebuildCmds as $cmd) {
    exec("cd $base && $cmd 2>&1", $rOut, $rRc);
    echo ($rRc === 0 ? "✅" : "❌") . " $cmd\n";
}

echo "\n======================================\n";
echo "  ✅ Deployment complete!\n";
echo "  ⚠️  DELETE THIS FILE NOW!\n";
echo "======================================\n";
echo "</pre>";
