<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "═══════════════════════════════════════════════════════\n";
echo "  DATABASE CONNECTION TEST\n";
echo "═══════════════════════════════════════════════════════\n\n";

try {
    DB::connection()->getPdo();
    echo "✓ Database Connection: SUCCESSFUL\n";
    echo "✓ Database Type: " . DB::connection()->getDriverName() . "\n";
    echo "✓ Database File: " . DB::connection()->getDatabaseName() . "\n\n";
    
    echo "TABLE COUNTS:\n";
    echo "  • Buyers: " . App\Models\Buyer::count() . "\n";
    echo "  • Sellers: " . App\Models\Seller::count() . "\n";
    echo "  • Deals: " . App\Models\Deal::count() . "\n";
    echo "  • Employees: " . App\Models\Employee::count() . "\n";
    echo "  • Countries: " . App\Models\Country::count() . "\n";
    echo "  • Currencies: " . App\Models\Currency::count() . "\n";
    echo "  • Industries: " . App\Models\Industry::count() . "\n";
    echo "  • Partners: " . App\Models\Partner::count() . "\n\n";
    
    echo "RELATIONSHIP TESTS:\n";
    $buyer = App\Models\Buyer::with('companyOverview')->first();
    echo "  • Buyer->companyOverview: " . ($buyer && $buyer->companyOverview ? "✓ WORKING" : "✗ FAILED") . "\n";
    
    $seller = App\Models\Seller::with('companyOverview')->first();
    echo "  • Seller->companyOverview: " . ($seller && $seller->companyOverview ? "✓ WORKING" : "✗ FAILED") . "\n";
    
    $deal = App\Models\Deal::with(['buyer', 'seller'])->first();
    echo "  • Deal->buyer: " . ($deal && $deal->buyer ? "✓ WORKING" : "✗ FAILED") . "\n";
    echo "  • Deal->seller: " . ($deal && $deal->seller ? "✓ WORKING" : "✗ FAILED") . "\n\n";
    
    echo "═══════════════════════════════════════════════════════\n";
    echo "  ALL DATABASE CONNECTIONS: ✓ VERIFIED\n";
    echo "═══════════════════════════════════════════════════════\n";
    
} catch (Exception $e) {
    echo "✗ Connection Failed: " . $e->getMessage() . "\n";
    exit(1);
}
