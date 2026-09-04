<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Google avatar URLs can exceed 512 chars (up to ~1k).
     * Widen users.avatar to TEXT on already-migrated databases.
     * Fresh installs are covered by the updated base migration.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql' && Schema::hasColumn('users', 'avatar')) {
            DB::statement('ALTER TABLE `users` MODIFY `avatar` TEXT NULL');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql' && Schema::hasColumn('users', 'avatar')) {
            DB::statement('ALTER TABLE `users` MODIFY `avatar` VARCHAR(512) NULL');
        }
    }
};
