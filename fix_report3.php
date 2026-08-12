<?php

$file = __DIR__ . '/app/Services/System/GenerateReportExcelService.php';
$content = file_get_contents($file);

// Fix the various patterns - escape $this properly
$content = preg_replace('/Row::fromValuesWithStyle\(\[(.*?)\],\s*\$this->([^(]+Style\(\)\)\(\),\s*15\.0\)\)/', "Row::fromValuesWithStyle([$1], \$this->$2, 15.0)", $content);
$content = preg_replace('/Row::fromValues\(\[(.*?)\],\s*\$this->([^(]+Style\(\)\)\)/', "Row::fromValuesWithStyle([$1], \$this->$2, 15.0)", $content);
$content = preg_replace('/Row::fromValues\(\[(.*?)\],\s*\$this->([^(]+Style\(\)\)\s*\)\)/', "Row::fromValuesWithStyle([$1], \$this->$2, 15.0)", $content);
$content = preg_replace('/Row::fromValues\(\[(.*?)\],\s*\$this->([^(]+Style\(\)\)\s*\)\)\)/', "Row::fromValuesWithStyle([$1], \$this->$2, 15.0)", $content);
$content = preg_replace('/Row::fromValuesWithStyle\(\[(.*?)\],\s*\$this->([^(]+Style\(\)\)\)/', "Row::fromValuesWithStyle([$1], \$this->$2, 15.0)", $content);
$content = preg_replace('/Row::fromValues\(\[(.*?)\],\s*\$this->([^(]+Style\(\)\)\)\s*\)\s*\)\)/', "Row::fromValuesWithStyle([$1], \$this->$2, 15.0)", $content);
$content = preg_replace('/Row::fromValues\(\[\]\)/', 'Row::fromValuesWithStyle([""], $this->dataStyle(false), 15.0)', $content);

file_put_contents($file, $content);

echo "Fixed all Row::fromValues calls\n";
