<?php

use App\Enums\SubscriptionStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->restrictOnDelete();
            $table->string('status', 20)->default(SubscriptionStatus::ACTIVE->value);
            $table->unsignedBigInteger('price_cents');
            $table->string('currency', 3)->default('EGP');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('renews_at')->nullable();
            $table->string('provider', 32)->nullable();
            $table->string('provider_ref')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        // DB-02: Enforce at the database level that a user cannot have more
        // than one ACTIVE subscription simultaneously.
        $this->addActiveSubscriptionConstraint();
    }

    public function down(): void
    {
        $this->dropActiveSubscriptionConstraint();
        Schema::dropIfExists('subscriptions');
    }

    private function addActiveSubscriptionConstraint(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        match ($driver) {
            'sqlite' => DB::statement(
                // SQLite partial indexes don't support parameter binding
                // This is a SQLite limitation, not a security vulnerability
                'CREATE UNIQUE INDEX subscriptions_active_user_unique '
                .'ON subscriptions (user_id) '
                ."WHERE status = '".SubscriptionStatus::ACTIVE->value."'"
            ),
            'mysql' => $this->addActiveSubscriptionConstraintForMysql(),
            default => throw new RuntimeException(
                "DB-02 constraint does not support driver: {$driver}. Expected sqlite or mysql."
            ),
        };
    }

    /**
     * MySQL / MariaDB path.
     *
     * A generated column cannot be used here: both engines reject certain
     * expressions (e.g. CASE) inside generated column definitions, and the
     * accepted subset differs between MySQL and MariaDB. Instead a plain
     * nullable column + unique index keeps the "one ACTIVE subscription per
     * user" invariant (NULLs never collide), and a BEFORE trigger keeps the
     * column in sync with `status` on every INSERT/UPDATE. Trigger bodies may
     * use CASE on both engines, so this is dialect-safe.
     */
    private function addActiveSubscriptionConstraintForMysql(): void
    {
        DB::statement(
            'ALTER TABLE subscriptions '
            .'ADD COLUMN active_user_id BIGINT UNSIGNED NULL AFTER status, '
            .'ADD UNIQUE KEY subscriptions_active_user_unique (active_user_id)'
        );

        DB::statement(
            'CREATE TRIGGER subscriptions_sync_active_user_id '
            .'BEFORE INSERT ON subscriptions '
            .'FOR EACH ROW '
            .'SET NEW.active_user_id = CASE '
            ."WHEN NEW.status = '".SubscriptionStatus::ACTIVE->value."' THEN NEW.user_id "
            .'ELSE NULL END'
        );

        DB::statement(
            'CREATE TRIGGER subscriptions_sync_active_user_id_update '
            .'BEFORE UPDATE ON subscriptions '
            .'FOR EACH ROW '
            .'SET NEW.active_user_id = CASE '
            ."WHEN NEW.status = '".SubscriptionStatus::ACTIVE->value."' THEN NEW.user_id "
            .'ELSE NULL END'
        );
    }

    private function dropActiveSubscriptionConstraint(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        match ($driver) {
            'sqlite' => DB::statement('DROP INDEX IF EXISTS subscriptions_active_user_unique'),
            'mysql' => DB::statement(
                "DROP TRIGGER IF EXISTS subscriptions_sync_active_user_id_update"
            ),
            default => null,
        };
        // MySQL requires dropping triggers separately from the table DROP.
        if ($driver === 'mysql') {
            DB::statement("DROP TRIGGER IF EXISTS subscriptions_sync_active_user_id");
            DB::statement('ALTER TABLE subscriptions DROP INDEX subscriptions_active_user_unique');
            DB::statement('ALTER TABLE subscriptions DROP COLUMN active_user_id');
        }
    }
};
