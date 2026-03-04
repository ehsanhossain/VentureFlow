<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== sellers_company_overviews ===\n";
$cols = \Schema::getColumnListing('sellers_company_overviews');
foreach ($cols as $c) echo "  $c\n";

echo "\n=== buyers_company_overviews ===\n";
$cols = \Schema::getColumnListing('buyers_company_overviews');
foreach ($cols as $c) echo "  $c\n";

echo "\n=== sellers ===\n";
$cols = \Schema::getColumnListing('sellers');
foreach ($cols as $c) echo "  $c\n";

echo "\n=== buyers ===\n";
$cols = \Schema::getColumnListing('buyers');
foreach ($cols as $c) echo "  $c\n";
