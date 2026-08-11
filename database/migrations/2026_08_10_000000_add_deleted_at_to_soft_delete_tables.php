<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Additive soft-delete columns for models using the SoftDeletes trait.
     *
     * HISTORY: commit 4fd3095 edited the original create_*_table migrations
     * in place to add `deleted_at`. That leaves existing databases that ran
     * the earlier create migrations without the column (verified locally:
     * `flight` and `attraction` already lack it in the dev SQLite DB).
     *
     * This migration restores additive semantics. The hasColumn guards keep
     * every database state safe:
     *
     *  - Fresh database: create migrations (now without softDeletes) run
     *    first, this migration then adds all ten columns.
     *  - Pre-change database: tables lack the columns, this migration adds
     *    them.
     *  - Partially-fixed database (e.g. the checked-in dev DB where
     *    flight/attraction never received the column): only the missing
     *    columns are added; existing ones are left untouched.
     *
     * down(): NOT made symmetrical on purpose. Dropping a column this
     * migration did not itself add would destroy pre-existing data state.
     * Rollback of soft deletes, if ever required, must be remediated
     * manually per environment.
     */
    public function up(): void
    {
        $tables = [
            'trips',
            'hotels',
            'categories',
            'countries',
            'destinations',
            'restaurants',
            'flights',
            'attractions',
            'surveys',
            'reviews',
        ];

        foreach ($tables as $table) {
            if (! Schema::hasTable($table) || Schema::hasColumn($table, 'deleted_at')) {
                continue;
            }

            Schema::table($table, function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        // Intentionally empty. See class docblock.
    }
};