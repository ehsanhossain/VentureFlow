<?php
echo "<h2>Detailed PHP CLI Search</h2><pre>";

// Check what's actually in the bin directories
$versions = ['8.3', '8.2', '8.1', '8.0'];
foreach ($versions as $v) {
    echo "\n=== /opt/plesk/php/$v/bin/ ===\n";
    exec("ls -la /opt/plesk/php/$v/bin/ 2>&1", $out);
    foreach ($out as $line) echo "$line\n";
    $out = [];
}

echo "\n=== file type check ===\n";
exec("file /opt/plesk/php/8.3/bin/php 2>&1", $out2);
foreach ($out2 as $line) echo "$line\n";

echo "\n=== readlink check ===\n";
exec("readlink -f /opt/plesk/php/8.3/bin/php 2>&1", $out3);
foreach ($out3 as $line) echo "$line\n";

echo "\n=== Try running it ===\n";
exec("/opt/plesk/php/8.3/bin/php -v 2>&1", $out4);
foreach ($out4 as $line) echo "$line\n";

echo "\n=== Try /usr/bin/php ===\n";
exec("/usr/bin/php -v 2>&1", $out5);
foreach ($out5 as $line) echo "$line\n";

echo "</pre>";
