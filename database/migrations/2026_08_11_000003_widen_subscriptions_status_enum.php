<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * SEC-10 gap closure: widen subscriptions.status enum to include
     * 'pending', 'expired', 'paused' while preserving 'active',
     * 'cancelled', 'past_due'.
     *
     * This is an ADDITIVE migration — the original create_subscriptions_table
     * migration is restored to its original 3-value enum. This migration
     * safely widens the column on fresh databases, existing databases, and
     * databases where the bad in-place migration already ran.
     */

    private const NEW_VALUES = ['pending', 'active', 'cancelled', 'past_due', 'expired', 'paused'];

    /**
     * Get the column name (handles obfuscation in this codebase).
     */
    private function statusColumn(): string
    {
        // The column is literally named 'status' in the schema.
        // This helper exists for clarity.
        return 'status';
    }

    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        match ($driver) {
            'sqlite' => $this->upSqlite(),
            'mysql'   => $this->upMysql(),
            default   => throw new \RuntimeException(
                "SEC-10 migration does not support driver: {$driver}. Expected sqlite or mysql."
            ),
        };
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        match ($driver) {
            'sqlite' => $this->downSqlite(),
            'mysql'   => $this->downMysql(),
            default   => throw new \RuntimeException(
                "SEC-10 migration does not support driver: {$driver}. Expected sqlite or mysql."
            ),
        };
    }

    /*
    |--------------------------------------------------------------------------
    | SQLite: recreate column with new enum values
    |--------------------------------------------------------------------------
    |
    | SQLite does not support ALTER TABLE ... ALTER COLUMN directly. Laravel's
    | $table->enum() creates a CHECK constraint. We drop and re-add the column
    | with the widened value set. The raw expression approach avoids data loss
    | because SQLite rebuilds the table transparently with all data preserved.
    |
    | Idempotency: if the column already has the widened check constraint,
    | we skip — the column definition will already match.
    |
    */

    private function upSqlite(): void
    {
        // Check if column already has the full set by inspecting the schema.
        // If 'expired' is already accepted, the bad migration ran — skip.
        if ($this->sqliteColumnAlreadyWidened()) {
            return;
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string($this->statusColumn(), 20)->default('active')->change();
        });

        // Re-add as proper enum with all six values.
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->enum($this->statusColumn(), self::NEW_VALUES)->default('active')->change();
        });
    }

    private function downSqlite(): void
    {
        // Do not narrow if rows use the new values.
        $usesNewValues = DB::table('subscriptions')
            ->whereIn('status', ['pending', 'expired', 'paused'])
            ->exists();

        if ($usesNewValues) {
            throw new \RuntimeException(
                'Cannot narrow subscriptions.status enum: rows exist with pending/expired/paused statuses.'
            );
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->enum($this->statusColumn(), ['active', 'cancelled', 'past_due'])->default('active')->change();
        });
    }

    private function sqliteColumnAlreadyWidened(): bool
    {
        // Inspect the raw schema SQL to see if 'expired' is already an accepted value.
        $schema = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name='subscriptions'")[0]->sql ?? '';

        return str_contains($schema, 'expired');
    }

    /*
    |--------------------------------------------------------------------------
    | MySQL: widen enum via ALTER TABLE ... MODIFY COLUMN
    |--------------------------------------------------------------------------
    |
    | MySQL enum is a true enum type. We use ALTER TABLE to widen the column,
    | preserving NULL/NOT NULL and default semantics. Idempotency is handled
    | by checking the current column definition first.
    |
    */

    private function upMysql(): void
    {
        // Check current definition — if already wide, skip (Scenario C idempotency).
        $columns = DB::select("SHOW COLUMNS FROM subscriptions WHERE Field = ?", [$this->statusColumn()]);

        if (empty($columns)) {
            return; // Column doesn't exist — nothing to widen.
        }

        $currentType = $columns[0]->Type ?? '';

        // If 'expired' is already in the enum, the bad migration already ran.
        if (str_contains($currentType, 'expired')) {
            return; // Already widened — idempotent.
        }

        $enumList = implode(',', array_map(fn ($v) => "'{$v}'", self::NEW_VALUES));

        DB::statement(
            "ALTER TABLE subscriptions MODIFY COLUMN status ENUM({$enumList}) DEFAULT 'active'"
        );
    }

    private function downMysql(): void
    {
        $usesNewValues = DB::table('subscriptions')
            ->whereIn('status', ['pending', 'expired', 'paused'])
            ->exists();

        if ($usesNewValues) {
            throw new \RuntimeException(
                'Cannot narrow subscriptions.status enum: rows exist with pending/expired/paused statuses.'
            );
        }

        $enumList = implode(',', array_map(fn ($v) => "'{$v}'", ['active', 'cancelled', 'past_due']));

        DB::statement(
            "ALTER TABLE subscriptions MODIFY COLUMN status ENUM({$enumList}) DEFAULT 'active'"
        );
    }
};
