<?php
$db = new SQLite3('database/database.sqlite');
$tables = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
$all = [];
while($row = $tables->fetchArray(SQLITE3_ASSOC)) {
    $count = $db->querySingle("SELECT count(*) FROM \"{$row['name']}\"");
    $all[] = "{$row['name']} ({$count})";
}
echo implode("\n", $all);
