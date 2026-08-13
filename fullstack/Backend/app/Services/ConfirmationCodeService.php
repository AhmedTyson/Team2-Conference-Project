<?php

namespace App\Services;

use Illuminate\Support\Str;

class ConfirmationCodeService
{
    /**
     * Generate a unique 8-character alphanumeric confirmation code.
     *
     * Format: XXXXXXXX (letters and numbers)
     * Example: A1B2C3D4, 9X8Z7Y6W, etc.
     *
     * @param  string  $table  Table name to check for uniqueness
     * @param  string  $column  Column name to check uniqueness
     * @return string Unique confirmation code
     */
    public function generateUniqueCode(string $table, string $column): string
    {
        do {
            $code = $this->generateRandomCode();
        } while ($this->codeExists($table, $column, $code));

        return $code;
    }

    /**
     * Generate a random 8-character alphanumeric code.
     */
    private function generateRandomCode(): string
    {
        return strtoupper(Str::random(8));
    }

    /**
     * Check if a code already exists in the specified table and column.
     *
     * @param  string  $table  Table name
     * @param  string  $column  Column name
     * @param  string  $code  Code to check
     */
    private function codeExists(string $table, string $column, string $code): bool
    {
        return \DB::table($table)->where($column, $code)->exists();
    }
}
