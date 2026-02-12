# Typography System Ban Check
# Run: powershell -ExecutionPolicy Bypass -File scripts/check-typography.ps1
# All patterns should return 0 matches

$srcPath = "src"
$fail = $false
$totalIssues = 0

Write-Host "============================================"
Write-Host "  TYPOGRAPHY BAN CHECK"
Write-Host "============================================"
Write-Host ""

# Font family bans
$fontBans = @("font-poppins", "font-inter\b", "font-serif\b", "font-black\b", "font-bold\b")
Write-Host "--- Font Bans ---"
foreach ($pattern in $fontBans) {
    $hits = Get-ChildItem -Recurse -Include "*.tsx", "*.ts" -Path $srcPath | Select-String -Pattern $pattern
    $count = if ($hits) { $hits.Count } else { 0 }
    if ($count -gt 0) {
        Write-Host "  FAIL: $pattern -> $count occurrences" -ForegroundColor Red
        $fail = $true
        $totalIssues += $count
    }
    else {
        Write-Host "  PASS: $pattern -> 0" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "--- Color Bans ---"

# Slate bans
$hits = Get-ChildItem -Recurse -Include "*.tsx", "*.ts" -Path $srcPath | Select-String -Pattern "text-slate-"
$count = if ($hits) { $hits.Count } else { 0 }
if ($count -gt 0) {
    Write-Host "  FAIL: text-slate-* -> $count occurrences" -ForegroundColor Red
    $fail = $true
    $totalIssues += $count
}
else {
    Write-Host "  PASS: text-slate-* -> 0" -ForegroundColor Green
}

# Hex gray duplicates
$hexBans = @("text-\[#9CA3AF\]", "text-\[#30313d\]", "text-\[#374151\]", "text-\[#6B7280\]", "text-\[#111827\]", "text-\[#1F2937\]", "text-\[#4B5563\]", "text-\[#D1D5DB\]")
foreach ($pattern in $hexBans) {
    $hits = Get-ChildItem -Recurse -Include "*.tsx", "*.ts" -Path $srcPath | Select-String -Pattern $pattern
    $count = if ($hits) { $hits.Count } else { 0 }
    if ($count -gt 0) {
        Write-Host "  FAIL: $pattern -> $count occurrences" -ForegroundColor Red
        $fail = $true
        $totalIssues += $count
    }
    else {
        Write-Host "  PASS: $pattern -> 0" -ForegroundColor Green
    }
}

# text-gray-800 (not in approved palette)
$hits = Get-ChildItem -Recurse -Include "*.tsx", "*.ts" -Path $srcPath | Select-String -Pattern "\btext-gray-800\b"
$count = if ($hits) { $hits.Count } else { 0 }
if ($count -gt 0) {
    Write-Host "  FAIL: text-gray-800 -> $count occurrences" -ForegroundColor Red
    $fail = $true
    $totalIssues += $count
}
else {
    Write-Host "  PASS: text-gray-800 -> 0" -ForegroundColor Green
}

# Neutral bans
$hits = Get-ChildItem -Recurse -Include "*.tsx", "*.ts" -Path $srcPath | Select-String -Pattern "text-neutral-"
$count = if ($hits) { $hits.Count } else { 0 }
if ($count -gt 0) {
    Write-Host "  FAIL: text-neutral-* -> $count occurrences" -ForegroundColor Red
    $fail = $true
    $totalIssues += $count
}
else {
    Write-Host "  PASS: text-neutral-* -> 0" -ForegroundColor Green
}

Write-Host ""
Write-Host "--- Inline Font Family Bans ---"
$inlineBans = @("font-\['Poppins", "font-\['Roboto", "font-\['Inter")
foreach ($pattern in $inlineBans) {
    $hits = Get-ChildItem -Recurse -Include "*.tsx", "*.ts" -Path $srcPath | Select-String -Pattern $pattern
    $count = if ($hits) { $hits.Count } else { 0 }
    if ($count -gt 0) {
        Write-Host "  FAIL: $pattern -> $count occurrences" -ForegroundColor Red
        $fail = $true
        $totalIssues += $count
    }
    else {
        Write-Host "  PASS: $pattern -> 0" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "============================================"
if ($fail) {
    Write-Host "  RESULT: FAIL ($totalIssues total issues)" -ForegroundColor Red
}
else {
    Write-Host "  RESULT: ALL CHECKS PASSED" -ForegroundColor Green
}
Write-Host "============================================"
