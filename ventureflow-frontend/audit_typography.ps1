$srcPath = "src"
$files = Get-ChildItem -Recurse -Include "*.tsx" -Path $srcPath

$sizes = @{}
$weights = @{}
$grayColors = @{}
$brandColors = @{}
$fontFamilies = @{}
$perFileData = @{}

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $relPath = $f.FullName.Replace((Get-Location).Path + "\src\", "")

    # Text sizes
    $ms = [regex]::Matches($content, "text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)")
    foreach ($m in $ms) {
        $v = $m.Value
        if ($sizes.ContainsKey($v)) { $sizes[$v]++ } else { $sizes[$v] = 1 }
    }

    # Font weights
    $mw = [regex]::Matches($content, "font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)")
    foreach ($m in $mw) {
        $v = $m.Value
        if ($weights.ContainsKey($v)) { $weights[$v]++ } else { $weights[$v] = 1 }
    }

    # Gray text colors
    $mc = [regex]::Matches($content, "text-gray-\d+")
    foreach ($m in $mc) {
        $v = $m.Value
        if ($grayColors.ContainsKey($v)) { $grayColors[$v]++ } else { $grayColors[$v] = 1 }
    }

    # Brand/other text colors
    $mb = [regex]::Matches($content, "text-\[(#[0-9a-fA-F]+)\]")
    foreach ($m in $mb) {
        $v = $m.Value
        if ($brandColors.ContainsKey($v)) { $brandColors[$v]++ } else { $brandColors[$v] = 1 }
    }

    # Named text colors (non-gray)
    $mn = [regex]::Matches($content, "text-(white|black|red|blue|green|yellow|orange|amber|emerald|teal|cyan|indigo|violet|purple|pink|rose|slate|zinc|neutral|stone)-\d+")
    foreach ($m in $mn) {
        $v = $m.Value
        if ($brandColors.ContainsKey($v)) { $brandColors[$v]++ } else { $brandColors[$v] = 1 }
    }

    # Font families
    $mf = [regex]::Matches($content, "font-(poppins|roboto|sans|serif|mono|inter)")
    foreach ($m in $mf) {
        $v = $m.Value
        if ($fontFamilies.ContainsKey($v)) { $fontFamilies[$v]++ } else { $fontFamilies[$v] = 1 }
    }

    # Per-file: track combination of page title sizes + weights
    $titleSizes = [regex]::Matches($content, "text-(2xl|xl|lg)")
    $titleWeights = [regex]::Matches($content, "font-(semibold|bold|medium|normal)")
    if ($titleSizes.Count -gt 0 -or $titleWeights.Count -gt 0) {
        $sizeList = ($titleSizes | ForEach-Object { $_.Value }) -join ", "
        $weightList = ($titleWeights | ForEach-Object { $_.Value }) -join ", "
        $perFileData[$relPath] = @{ sizes = $sizeList; weights = $weightList }
    }
}

Write-Host "============================================"
Write-Host "       TYPOGRAPHY AUDIT SUMMARY"
Write-Host "============================================"
Write-Host ""
Write-Host "--- TEXT SIZES (Tailwind classes) ---"
$sizes.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { Write-Host ("{0,-15} {1} occurrences" -f $_.Key, $_.Value) }
Write-Host ""
Write-Host "--- FONT WEIGHTS ---"
$weights.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { Write-Host ("{0,-20} {1} occurrences" -f $_.Key, $_.Value) }
Write-Host ""
Write-Host "--- GRAY TEXT COLORS ---"
$grayColors.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { Write-Host ("{0,-20} {1} occurrences" -f $_.Key, $_.Value) }
Write-Host ""
Write-Host "--- BRAND/HEX TEXT COLORS ---"
$brandColors.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { Write-Host ("{0,-30} {1} occurrences" -f $_.Key, $_.Value) }
Write-Host ""
Write-Host "--- FONT FAMILIES ---"
$fontFamilies.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { Write-Host ("{0,-20} {1} occurrences" -f $_.Key, $_.Value) }
Write-Host ""
Write-Host "--- PER-FILE TITLE TYPOGRAPHY ---"
foreach ($entry in ($perFileData.GetEnumerator() | Sort-Object Key)) {
    Write-Host ("{0}" -f $entry.Key)
    Write-Host ("  Sizes:   {0}" -f $entry.Value.sizes)
    Write-Host ("  Weights: {0}" -f $entry.Value.weights)
}
