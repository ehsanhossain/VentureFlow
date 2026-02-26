<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(300);
header('Content-Type: text/plain');

$root = dirname(__DIR__);
chdir($root);
echo "Working in: $root\n\n";

// Step 0: FORCE clear config cache (this was causing .env to not be read!)
echo "=== Step 0: Clearing config cache ===\n";
$cachedConfig = "$root/bootstrap/cache/config.php";
if (file_exists($cachedConfig)) {
    unlink($cachedConfig);
    echo "Deleted cached config.php\n";
} else {
    echo "No cached config found\n";
}
// Also clear other cached files
foreach (glob("$root/bootstrap/cache/*.php") as $cacheFile) {
    unlink($cacheFile);
    echo "Deleted: " . basename($cacheFile) . "\n";
}
echo "\n";

// Step 1: Download Composer if not exists
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

// Step 2: Run composer install
echo "Running composer install (this takes 1-2 min)...\n";
$out2 = [];
exec("/opt/plesk/php/8.3/bin/php $root/composer.phar install --no-dev --optimize-autoloader --no-interaction 2>&1", $out2, $exitCode);
echo implode("\n", $out2) . "\n";
echo "Exit code: $exitCode\n\n";

// Step 3: Run database migrations
echo "Running migrations...\n";
$out_mig = [];
exec("/opt/plesk/php/8.3/bin/php $root/artisan migrate --force 2>&1", $out_mig, $migExit);
echo implode("\n", $out_mig) . "\n";
echo "Migration exit code: $migExit\n\n";

// Step 4: Fix permissions
echo "Fixing permissions...\n";
exec("chmod -R 775 $root/storage $root/bootstrap/cache 2>&1", $out3);
echo implode("\n", $out3) . "\n";

// Step 5: Create storage link
echo "Creating storage link...\n";
exec("/opt/plesk/php/8.3/bin/php $root/artisan storage:link 2>&1", $out4);
echo implode("\n", $out4) . "\n";

// Step 6: Clear ALL caches
echo "Clearing all caches...\n";
exec("/opt/plesk/php/8.3/bin/php $root/artisan config:clear 2>&1", $out5);
exec("/opt/plesk/php/8.3/bin/php $root/artisan cache:clear 2>&1", $out6);
exec("/opt/plesk/php/8.3/bin/php $root/artisan route:clear 2>&1", $out7);
exec("/opt/plesk/php/8.3/bin/php $root/artisan view:clear 2>&1", $out8);
echo implode("\n", array_merge($out5, $out6, $out7, $out8)) . "\n";

// Step 7: Verify
echo "\n=== VERIFICATION ===\n";
echo "vendor/autoload.php: " . (file_exists("$root/vendor/autoload.php") ? 'YES' : 'NO') . "\n";

// Show key .env values (safe ones only)
if (file_exists("$root/.env")) {
    $envContent = file_get_contents("$root/.env");
    $lines = explode("\n", $envContent);
    echo "\n.env key values:\n";
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || $line[0] === '#') continue;
        // Only show safe keys, mask passwords
        if (preg_match('/^(APP_URL|APP_ENV|DB_CONNECTION|DB_HOST|DB_DATABASE|SESSION_DRIVER|SESSION_DOMAIN|SANCTUM_STATEFUL_DOMAINS|FRONTEND_URL)=(.*)$/', $line, $m)) {
            echo "  $line\n";
        }
    }
}

echo "\nDone!\n";
