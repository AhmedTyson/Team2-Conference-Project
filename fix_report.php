<?php

$file = __DIR__ . '/app/Services/System/GenerateReportExcelService.php';
$content = file_get_contents($file);

// Replace Row::fromValues with Row::fromValuesWithStyle
$content = preg_replace(
    '/Row::fromValues\(\[(.*?)\],\s*\$this->([^(]+Style\(\)\))/',
    'Row::fromValuesWithStyle([$1], $this->$2, 15.0)',
    $content
);

// Replace empty rows
$content = preg_replace(
    '/Row::fromValues\(\[\]\)/',
    'Row::fromValuesWithStyle([""], $this->dataStyle(false), 15.0)',
    $content
);

file_put_contents($file, $content);

echo "Updated file\n";
