<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(300);
header('Content-Type: text/plain');

$root = dirname(__DIR__);
chdir($root);
$php = '/opt/plesk/php/8.3/bin/php';
echo "Working in: $root\n\n";

// Step 0: Clear ALL cached config
echo "=== Step 0: Clearing ALL caches ===\n";
foreach (glob("$root/bootstrap/cache/*.php") as $cacheFile) {
    unlink($cacheFile);
    echo "Deleted: " . basename($cacheFile) . "\n";
}
$sqliteDb = "$root/database/database.sqlite";
if (file_exists($sqliteDb)) {
    unlink($sqliteDb);
    echo "Deleted stale SQLite database\n";
}
echo "\n";

// Step 1: Create required storage directories
echo "=== Step 1: Creating storage directories ===\n";
$dirs = [
    "$root/storage/app/public",
    "$root/storage/app/public/employees",
    "$root/storage/app/public/partners",
    "$root/storage/app/public/sellers",
    "$root/storage/app/public/buyers",
    "$root/storage/app/public/email-assets",
    "$root/storage/framework/cache/data",
    "$root/storage/framework/sessions",
    "$root/storage/framework/views",
    "$root/storage/logs",
    "$root/bootstrap/cache",
];
foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
        echo "Created: " . str_replace($root, '', $dir) . "\n";
    } else {
        echo "Exists:  " . str_replace($root, '', $dir) . "\n";
    }
}
echo "\n";

// Step 2: Fix ALL permissions
echo "=== Step 2: Fixing permissions ===\n";
exec("chmod -R 775 $root/storage 2>&1", $permOut1);
exec("chmod -R 775 $root/bootstrap/cache 2>&1", $permOut2);
echo implode("\n", array_merge($permOut1, $permOut2)) . "\n";
echo "storage writable: " . (is_writable("$root/storage/app/public") ? 'YES ✅' : 'NO ❌') . "\n\n";

// Step 3: Verify .env
echo "=== Step 3: Checking .env ===\n";
if (file_exists("$root/.env")) {
    $lines = explode("\n", file_get_contents("$root/.env"));
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || $line[0] === '#') continue;
        if (preg_match('/^(APP_URL|APP_ENV|DB_CONNECTION|DB_HOST|DB_DATABASE|DB_USERNAME|SESSION_DRIVER|SESSION_DOMAIN|SANCTUM_STATEFUL_DOMAINS|FRONTEND_URL)=/', $line)) {
            echo "  $line\n";
        }
    }
} else {
    echo "  ⚠️ .env NOT FOUND!\n";
}
echo "\n";

// Step 4: Composer install
if (!file_exists("$root/composer.phar")) {
    echo "Downloading Composer...\n";
    copy('https://getcomposer.org/installer', "$root/composer-setup.php");
    exec("$php $root/composer-setup.php --install-dir=$root 2>&1", $out);
    echo implode("\n", $out) . "\n";
    unlink("$root/composer-setup.php");
} else {
    echo "Composer already exists.\n";
}
echo "Running composer install...\n";
$out2 = [];
exec("$php $root/composer.phar install --no-dev --optimize-autoloader --no-interaction 2>&1", $out2, $exitCode);
// Only show last 5 lines to keep output clean
$lines2 = explode("\n", implode("\n", $out2));
echo implode("\n", array_slice($lines2, -5)) . "\n";
echo "Composer exit code: $exitCode\n\n";

// Step 5: Clear caches before migration
echo "=== Step 5: Clearing artisan caches ===\n";
exec("$php $root/artisan config:clear 2>&1", $c1);
exec("$php $root/artisan cache:clear 2>&1", $c2);
exec("$php $root/artisan route:clear 2>&1", $c3);
exec("$php $root/artisan view:clear 2>&1", $c4);
echo "Caches cleared.\n\n";

// Step 6: Run migrations
echo "=== Step 6: Running migrations ===\n";
$out_mig = [];
exec("$php $root/artisan migrate --force 2>&1", $out_mig, $migExit);
echo implode("\n", $out_mig) . "\n";
echo "Migration exit code: $migExit\n\n";

// Step 7: Storage link
echo "=== Step 7: Storage link ===\n";
exec("$php $root/artisan storage:link 2>&1", $sl);
echo implode("\n", $sl) . "\n\n";

// Step 8: Verify new deal columns
echo "=== Step 8: Verifying deal table columns ===\n";
try {
    require_once "$root/vendor/autoload.php";
    $app = require_once "$root/bootstrap/app.php";
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

// Step 8.5: Build Frontend
echo "\n=== Step 8.5: Building Frontend ===\n";
$frontendDir = dirname($root) . '/ventureflow-frontend';
if (!is_dir($frontendDir)) {
    // Try monorepo layout (frontend is sibling of backend in httpdocs)
    $frontendDir = $root . '/../ventureflow-frontend';
}
// Normalize path for safety
$frontendDir = realpath($frontendDir) ?: $frontendDir;

echo "Frontend dir: $frontendDir\n";

if (is_dir($frontendDir)) {
    // Find node binary - check common Plesk paths
    $nodePaths = [
        '/opt/plesk/node/22/bin/node',
        '/opt/plesk/node/20/bin/node',
        '/opt/plesk/node/18/bin/node',
        '/usr/local/bin/node',
        '/usr/bin/node',
    ];
    $nodeFound = '';
    foreach ($nodePaths as $np) {
        if (file_exists($np)) {
            $nodeFound = $np;
            break;
        }
    }
    
    // Also try which
    if (!$nodeFound) {
        $nodeFound = trim(shell_exec('which node 2>/dev/null') ?? '');
    }
    
    if ($nodeFound) {
        $nodeDir = dirname($nodeFound);
        $npmBin = "$nodeDir/npm";
        echo "Node: $nodeFound\n";
        echo "npm: $npmBin\n";
        
        // Get node version
        exec("$nodeFound --version 2>&1", $nv);
        echo "Node version: " . implode('', $nv) . "\n\n";
        
        // npm install
        echo ">>> npm install...\n";
        $npmInstallOut = [];
        exec("cd $frontendDir && PATH=$nodeDir:\$PATH $npmBin install --production=false 2>&1", $npmInstallOut, $npmInstallExit);
        echo implode("\n", array_slice($npmInstallOut, -3)) . "\n";
        echo "npm install exit: $npmInstallExit\n\n";
        
        if ($npmInstallExit === 0) {
            // npm run build
            echo ">>> npm run build...\n";
            $npmBuildOut = [];
            exec("cd $frontendDir && PATH=$nodeDir:\$PATH $npmBin run build 2>&1", $npmBuildOut, $npmBuildExit);
            echo implode("\n", array_slice($npmBuildOut, -5)) . "\n";
            echo "npm build exit: $npmBuildExit\n";
            
            if ($npmBuildExit === 0) {
                echo "✅ Frontend built successfully!\n";
                // Check dist exists
                echo "dist/index.html: " . (file_exists("$frontendDir/dist/index.html") ? 'YES ✅' : 'NO ❌') . "\n";
            } else {
                echo "❌ Frontend build FAILED\n";
            }
        } else {
            echo "❌ npm install FAILED\n";
        }
    } else {
        echo "⚠️ Node.js not found on server.\n";
        echo "Checked: " . implode(', ', $nodePaths) . "\n";
        echo "Frontend cannot be built automatically.\n";
        
        // Check if dist already exists (from git or manual build)
        if (file_exists("$frontendDir/dist/index.html")) {
            echo "dist/index.html: EXISTS (using git-committed build) ✅\n";
        } else {
            echo "dist/index.html: MISSING ❌\n";
            echo "You need Node.js on the server or commit dist/ to git.\n";
        }
    }
} else {
    echo "⚠️ Frontend directory not found at: $frontendDir\n";
}
echo "\n";

// Step 9: Final cache clear
echo "=== Step 9: Final cache clear ===\n";
exec("$php $root/artisan config:clear 2>&1", $f1);
exec("$php $root/artisan cache:clear 2>&1", $f2);
echo "Done.\n\n";

// Verification
echo "=== VERIFICATION ===\n";
echo "vendor/autoload.php: " . (file_exists("$root/vendor/autoload.php") ? 'YES' : 'NO') . "\n";
echo "SQLite exists: " . (file_exists($sqliteDb) ? 'YES (BAD!)' : 'NO (GOOD!)') . "\n";
echo "storage/app/public: " . (is_dir("$root/storage/app/public") ? 'YES' : 'NO') . "\n";
echo "storage writable: " . (is_writable("$root/storage/app/public") ? 'YES ✅' : 'NO ❌') . "\n";

// Test write
$testFile = "$root/storage/app/public/test_write.tmp";
$writeOk = @file_put_contents($testFile, 'test');
echo "Can write files: " . ($writeOk !== false ? 'YES ✅' : 'NO ❌') . "\n";
if ($writeOk !== false) @unlink($testFile);

echo "\nDone!\n";
