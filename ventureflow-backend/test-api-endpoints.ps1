# API Endpoint Verification Script
# Tests all critical VentureFlow API endpoints

$baseUrl = "http://127.0.0.1:8000/api"
$headers = @{
    "Accept" = "application/json"
    "Content-Type" = "application/json"
}

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  API ENDPOINT VERIFICATION TEST" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$testResults = @()

# Test 1: Countries Endpoint (Public - No Auth)
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/countries" -Method GET -Headers $headers -ErrorAction Stop
    $testResults += [PSCustomObject]@{
        Endpoint = "GET /api/countries"
        Status = "✓ PASS"
        Count = $response.data.Count
        Color = "Green"
    }
} catch {
    $testResults += [PSCustomObject]@{
        Endpoint = "GET /api/countries"
        Status = "✗ FAIL"
        Count = "Error: $($_.Exception.Message)"
        Color = "Red"
    }
}

# Test 2: Currencies Endpoint
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/currencies" -Method GET -Headers $headers -ErrorAction Stop
    $testResults += [PSCustomObject]@{
        Endpoint = "GET /api/currencies"
        Status = "✓ PASS"
        Count = $response.data.Count
        Color = "Green"
    }
} catch {
    $testResults += [PSCustomObject]@{
        Endpoint = "GET /api/currencies"
        Status = "✗ FAIL"
        Count = "Error"
        Color = "Red"
    }
}

# Test 3: Industries Endpoint
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/industries" -Method GET -Headers $headers -ErrorAction Stop
    $testResults += [PSCustomObject]@{
        Endpoint = "GET /api/industries"
        Status = "✓ PASS"
        Count = $response.data.Count
        Color = "Green"
    }
} catch {
    $testResults += [PSCustomObject]@{
        Endpoint = "GET /api/industries"
        Status = "✗ FAIL"
        Count = "Error"
        Color = "Red"
    }
}

# Test 4: Buyers Endpoint (Requires Auth - will fail with 401)
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/buyer" -Method GET -Headers $headers -ErrorAction Stop
    $testResults += [PSCustomObject]@{
        Endpoint = "GET /api/buyer"
        Status = "✓ PASS (Auth)"
        Count = "Authenticated"
        Color = "Yellow"
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        $testResults += [PSCustomObject]@{
            Endpoint = "GET /api/buyer"
            Status = "✓ PASS (Auth Required)"
            Count = "401 Expected"
            Color = "Yellow"
        }
    } else {
        $testResults += [PSCustomObject]@{
            Endpoint = "GET /api/buyer"
            Status = "✗ FAIL"
            Count = "Unexpected Error"
            Color = "Red"
        }
    }
}

# Test 5: Sellers Endpoint (Requires Auth)
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/seller" -Method GET -Headers $headers -ErrorAction Stop
    $testResults += [PSCustomObject]@{
        Endpoint = "GET /api/seller"
        Status = "✓ PASS (Auth)"
        Count = "Authenticated"
        Color = "Yellow"
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        $testResults += [PSCustomObject]@{
            Endpoint = "GET /api/seller"
            Status = "✓ PASS (Auth Required)"
            Count = "401 Expected"
            Color = "Yellow"
        }
    } else {
        $testResults += [PSCustomObject]@{
            Endpoint = "GET /api/seller"
            Status = "✗ FAIL"
            Count = "Unexpected Error"
            Color = "Red"
        }
    }
}

# Display Results
Write-Host "`nRESULTS:" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────`n"

foreach ($result in $testResults) {
    Write-Host "  $($result.Endpoint.PadRight(30)) " -NoNewline
    Write-Host $result.Status -ForegroundColor $result.Color -NoNewline
    Write-Host " ($($result.Count))"
}

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
$passCount = ($testResults | Where-Object { $_.Status -like "*PASS*" }).Count
$totalCount = $testResults.Count
Write-Host "  SUMMARY: $passCount/$totalCount endpoints verified" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan
