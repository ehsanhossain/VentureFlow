<?php
/**
 * Deploy Hook - Runs artisan commands after Plesk deployment
 * This script is called via the web since Plesk deploy actions
 * cannot access the PHP CLI binary due to chroot restrictions.
 *
 * SECURITY: This file checks for a deploy token to prevent unauthorized access.
 * After initial setup, consider removing or restricting this file.
 */

// Simple security token - change this to something unique
$DEPLOY_TOKEN = 'vf_deploy_2026_secure';

if (!isset($_GET['token']) || $_GET['token'] !== $DEPLOY_TOKEN) {
    http_response_code(403);
    die('Forbidden');
}

// Change to the Laravel root directory (one level up from public/)
chdir(dirname(__DIR__));

header('Content-Type: text/plain');
echo "Deploy Hook Running...\n";
echo "Working directory: " . getcwd() . "\n\n";

$commands = [
    'migrate --force',
    'config:clear',
    'cache:clear',
    'route:clear',
    'view:clear',
    'storage:link',
];

$phpBin = '/opt/plesk/php/8.3/bin/php';

foreach ($commands as $cmd) {
    echo ">>> php artisan $cmd\n";
    $output = [];
    $exitCode = 0;
    exec("$phpBin artisan $cmd 2>&1", $output, $exitCode);
    echo implode("\n", $output) . "\n";
    echo "Exit code: $exitCode\n\n";
}

echo "Deploy Hook Complete!\n";
