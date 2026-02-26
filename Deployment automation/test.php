<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(300);
header('Content-Type: text/plain');

$root = dirname(__DIR__);
chdir($root);
echo "Working in: $root\n\n";

// Step 0: FORCE clear ALL cached config
echo "=== Step 0: Clearing ALL caches ===\n";
foreach (glob("$root/bootstrap/cache/*.php") as $cacheFile) {
    unlink($cacheFile);
    echo "Deleted: " . basename($cacheFile) . "\n";
}

// Also delete stale SQLite database if it exists (we use MySQL now)
$sqliteDb = "$root/database/database.sqlite";
if (file_exists($sqliteDb)) {
    unlink($sqliteDb);
    echo "Deleted stale SQLite database\n";
}
echo "\n";

// Step 1: Verify .env exists and has correct DB settings
echo "=== Step 1: Checking .env ===\n";
if (file_exists("$root/.env")) {
    $envContent = file_get_contents("$root/.env");
    $lines = explode("\n", $envContent);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || $line[0] === '#') continue;
        if (preg_match('/^(APP_URL|APP_ENV|DB_CONNECTION|DB_HOST|DB_DATABASE|DB_USERNAME|SESSION_DRIVER|SESSION_DOMAIN|SANCTUM_STATEFUL_DOMAINS|FRONTEND_URL)=/', $line)) {
            echo "  $line\n";
        }
    }
} else {
    echo "  ⚠️ .env file NOT FOUND! Deployment failed to include .env\n";
}
echo "\n";

// Step 2: Download Composer if not exists
if (!file_exists("$root/composer.phar")) {
    echo "Downloading Composer...\n";
    copy('https://getcomposer.org/installer', "$root/composer-setup.php");
    exec("/opt/plesk/php/8.3/bin/php $root/composer-setup.php --install-dir=$root 2>&1", $out);
    echo implode("\n", $out) . "\n";
    unlink("$root/composer-setup.php");
    echo "Done.\n\n";
} else {
    echo "Composer already exists.\n\n";
}

// Step 3: Run composer install
echo "Running composer install...\n";
$out2 = [];
exec("/opt/plesk/php/8.3/bin/php $root/composer.phar install --no-dev --optimize-autoloader --no-interaction 2>&1", $out2, $exitCode);
echo implode("\n", $out2) . "\n";
echo "Exit code: $exitCode\n\n";

// Step 4: Clear ALL artisan caches BEFORE migrations
echo "Clearing artisan caches before migration...\n";
exec("/opt/plesk/php/8.3/bin/php $root/artisan config:clear 2>&1", $outCfg);
exec("/opt/plesk/php/8.3/bin/php $root/artisan cache:clear 2>&1", $outCch);
exec("/opt/plesk/php/8.3/bin/php $root/artisan route:clear 2>&1", $outRt);
exec("/opt/plesk/php/8.3/bin/php $root/artisan view:clear 2>&1", $outVw);
echo implode("\n", array_merge($outCfg, $outCch, $outRt, $outVw)) . "\n\n";

// Step 5: Run database migrations
echo "Running migrations...\n";
$out_mig = [];
exec("/opt/plesk/php/8.3/bin/php $root/artisan migrate --force 2>&1", $out_mig, $migExit);
echo implode("\n", $out_mig) . "\n";
echo "Migration exit code: $migExit\n\n";

// Step 6: Fix permissions
echo "Fixing permissions...\n";
exec("chmod -R 775 $root/storage $root/bootstrap/cache 2>&1", $out3);
echo implode("\n", $out3) . "\n";

// Step 7: Create storage link
echo "Creating storage link...\n";
exec("/opt/plesk/php/8.3/bin/php $root/artisan storage:link 2>&1", $out4);
echo implode("\n", $out4) . "\n";

// Step 8: Final cache clear
echo "Final cache clear...\n";
exec("/opt/plesk/php/8.3/bin/php $root/artisan config:clear 2>&1", $out5);
exec("/opt/plesk/php/8.3/bin/php $root/artisan cache:clear 2>&1", $out6);
echo implode("\n", array_merge($out5, $out6)) . "\n";

// Step 9: Verify
echo "\n=== VERIFICATION ===\n";
echo "vendor/autoload.php: " . (file_exists("$root/vendor/autoload.php") ? 'YES' : 'NO') . "\n";
echo "SQLite database exists: " . (file_exists($sqliteDb) ? 'YES (BAD!)' : 'NO (GOOD!)') . "\n";
echo "\nDone!\n";
