<?php


echo "Current script directory (__DIR__): " . __DIR__ . "<br>";
echo "Document Root (\$_SERVER['DOCUMENT_ROOT']): " . $_SERVER['DOCUMENT_ROOT'] . "<br>";



$projectRoot = dirname(__DIR__);

echo "Calculated Project Root: " . $projectRoot . "<br>";



$target = $projectRoot . '/storage/app/public';



$link = __DIR__ . '/storage';

echo "Attempting to link: <br>";
echo "Target (actual files should be here): " . $target . "<br>";
echo "Attempting to create Link at (publicly accessible): " . $link . "<br><br>";




if (!is_dir($target)) {
    exit("ERROR: The target directory '{$target}' does not exist. Please ensure your 'storage/app/public' folder is correctly set up at the project root level.<br>");
}
echo "Target directory '{$target}' exists.<br>";


$linkParentDir = dirname($link);
if (!is_dir($linkParentDir)) {

    exit("ERROR: The parent directory for the link '{$linkParentDir}' (this script's current directory) does not exist. This is unexpected.<br>");
}
echo "Link parent directory '{$linkParentDir}' exists.<br>";



if (file_exists($link) || is_link($link)) {
    echo "Path '{$link}' already exists. Determining its type...<br>";

    if (is_link($link)) {
        echo "'{$link}' is a symbolic link. Attempting to remove it...<br>";
        if (unlink($link)) {
            echo "Symbolic link '{$link}' removed successfully.<br>";
        } else {
            $error = error_get_last();
            exit("ERROR: Failed to remove existing symbolic link '{$link}'. PHP Error: " . ($error['message'] ?? 'Unknown error') . "<br>Please remove it manually via Plesk File Manager and try again.<br>");
        }
    } elseif (is_dir($link)) {



        exit("ERROR: '{$link}' exists as a DIRECTORY, not a symlink. For safety, please remove this directory manually via Plesk File Manager and then re-run this script.<br>");
    } else {



        echo "'{$link}' is a file. Attempting to remove it...<br>";
        if (unlink($link)) {
            echo "File '{$link}' removed successfully.<br>";
        } else {
            $error = error_get_last();
            exit("ERROR: Failed to remove existing file '{$link}'. PHP Error: " . ($error['message'] ?? 'Unknown error') . "<br>Please remove it manually via Plesk File Manager and try again.<br>");
        }
    }
} else {
    echo "Path '{$link}' does not currently exist. Proceeding to create symlink.<br>";
}

// Attempt to create the symbolic link
echo "Attempting to create symbolic link from '{$target}' to '{$link}'...<br>";
if (symlink($target, $link)) {
    echo "SUCCESS: Symbolic link created successfully!<br>";

    echo "Target: " . $target . " (Resolved: " . (realpath($target) ?: 'N/A') . ")<br>";
    echo "Link: " . $link . " (Resolved: " . (realpath($link) ?: 'N/A') . ", Points to: " . (readlink($link) ?: 'N/A') . ")<br>";
    echo "<br><strong>Please verify that your images are now loading correctly.</strong>";
} else {
    echo "FAILED to create symbolic link.<br>";
    echo "Possible reasons:<br>";
    echo "1. PHP's `symlink()` function might be disabled in your server's php.ini (`disable_functions`).<br>";
    echo "2. Insufficient permissions for the PHP process to create links in the '{$linkParentDir}' directory or to access '{$target}'.<br>";
    echo "3. The file system might not support symbolic links (rare on modern Linux servers).<br>";
    $error = error_get_last();
    if ($error) {
        echo "<br>PHP Error: " . $error['message'] . "<br>";
    }
    echo "<br>Please check your Plesk PHP settings, directory permissions, or contact your hosting provider for assistance.";
}

echo "<br><br>--- Script Finished ---<br>";
echo "<strong>IMPORTANT: Delete this script (create_symlink.php) from your server after use for security reasons!</strong>";

?>
