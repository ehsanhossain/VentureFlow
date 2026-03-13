<?php
/**
 * Deploy Hook - Runs after Plesk pulls from deploy branch
 * Handles: composer install, artisan commands, permissions
 *
 * SECURITY: Protected by deploy token
 */

$DEPLOY_TOKEN = 'vf_deploy_2026_secure';

if (!isset($_GET['token']) || $_GET['token'] !== $DEPLOY_TOKEN) {
    http_response_code(403);
    die('Forbidden');
}

error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(300);
header('Content-Type: text/plain');

$root = dirname(__DIR__);
chdir($root);
$phpBin = '/opt/plesk/php/8.3/bin/php';

echo "=== VentureFlow Deploy Hook ===\n";
echo "Directory: $root\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n\n";

// Step 1: Composer install
echo ">>> Composer install...\n";
if (!file_exists("$root/composer.phar")) {
    echo "Downloading composer...\n";
    copy('https://getcomposer.org/installer', "$root/composer-setup.php");
    exec("$phpBin $root/composer-setup.php --install-dir=$root 2>&1", $out);
    echo implode("\n", $out) . "\n";
    @unlink("$root/composer-setup.php");
}
$out = [];
exec("$phpBin $root/composer.phar install --no-dev --optimize-autoloader --no-interaction 2>&1", $out, $code);
echo implode("\n", $out) . "\n";
echo "Exit: $code\n\n";

// Step 2: Artisan commands
$commands = [
    'migrate --force',
    'config:clear',
    'cache:clear',
    'route:clear',
    'view:clear',
    'storage:link',
];

foreach ($commands as $cmd) {
    echo ">>> php artisan $cmd\n";
    $out = [];
    exec("$phpBin artisan $cmd 2>&1", $out, $code);
    echo implode("\n", $out) . "\n";
    echo "Exit: $code\n\n";
}

// Step 3: Fix permissions
echo ">>> Fixing permissions...\n";
exec("chmod -R 775 $root/storage $root/bootstrap/cache 2>&1", $out);
echo implode("\n", $out) . "\n\n";

echo "=== Deploy Complete! ===\n";
