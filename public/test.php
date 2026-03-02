<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(300);
header('Content-Type: text/plain');

$root = dirname(__DIR__);
chdir($root);
$php = '/opt/plesk/php/8.3/bin/php';
echo "Working in: $root\n\n";

// ──────────────────────────────────────────────────────────
// Step 0: Git pull from deploy branch (fetch latest code)
// ──────────────────────────────────────────────────────────
echo "=== Step 0: Git pull (deploy branch) ===\n";
$gitOut = [];
// Check if this is a git repo
if (is_dir("$root/.git")) {
    // Reset any local changes and pull latest
    exec("cd $root && git fetch origin 2>&1", $gitOut);
    exec("cd $root && git reset --hard origin/deploy 2>&1", $gitOut);
    echo implode("\n", $gitOut) . "\n";
    
    // Show current commit
    $commitOut = [];
    exec("cd $root && git log --oneline -1 2>&1", $commitOut);
    echo "Current commit: " . implode('', $commitOut) . "\n";
} else {
    echo "⚠️ Not a git repo — skipping pull\n";
    echo "Plesk should be managing git pulls automatically.\n";
}
echo "\n";

// Step 1: Clear ALL cached config
echo "=== Step 1: Clearing ALL caches ===\n";
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

// Step 2: Create required storage directories
echo "=== Step 2: Creating storage directories ===\n";
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

// Step 3: Fix ALL permissions
echo "=== Step 3: Fixing permissions ===\n";
exec("chmod -R 775 $root/storage 2>&1", $permOut1);
exec("chmod -R 775 $root/bootstrap/cache 2>&1", $permOut2);
echo implode("\n", array_merge($permOut1, $permOut2)) . "\n";
echo "storage writable: " . (is_writable("$root/storage/app/public") ? 'YES ✅' : 'NO ❌') . "\n\n";

// Step 4: Verify .env
echo "=== Step 4: Checking .env ===\n";
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

// Step 5: Composer install
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

// Step 6: Clear caches before migration
echo "=== Step 6: Clearing artisan caches ===\n";
exec("$php $root/artisan config:clear 2>&1", $c1);
exec("$php $root/artisan cache:clear 2>&1", $c2);
exec("$php $root/artisan route:clear 2>&1", $c3);
exec("$php $root/artisan view:clear 2>&1", $c4);
echo "Caches cleared.\n\n";

// Step 7: Run migrations
echo "=== Step 7: Running migrations ===\n";
$out_mig = [];
exec("$php $root/artisan migrate --force 2>&1", $out_mig, $migExit);
echo implode("\n", $out_mig) . "\n";
echo "Migration exit code: $migExit\n\n";

// Step 8: Storage link
echo "=== Step 8: Storage link ===\n";
exec("$php $root/artisan storage:link 2>&1", $sl);
echo implode("\n", $sl) . "\n\n";

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
