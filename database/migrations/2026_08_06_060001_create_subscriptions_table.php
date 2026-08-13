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
                "CREATE UNIQUE INDEX subscriptions_active_user_unique "
                . "ON subscriptions (user_id) "
                . "WHERE status = '" . SubscriptionStatus::ACTIVE->value . "'"
            ),
            'mysql'  => DB::statement(
                "ALTER TABLE subscriptions "
                . "ADD COLUMN active_user_id INT GENERATED ALWAYS AS "
                . "(CASE WHEN status = ? THEN user_id ELSE NULL END) STORED"
                . ", ADD UNIQUE KEY subscriptions_active_user_unique (active_user_id)",
                [SubscriptionStatus::ACTIVE->value]
            ),
            default  => throw new \RuntimeException(
                "DB-02 constraint does not support driver: {$driver}. Expected sqlite or mysql."
            ),
        };
    }

    private function dropActiveSubscriptionConstraint(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        match ($driver) {
            'sqlite' => DB::statement('DROP INDEX IF EXISTS subscriptions_active_user_unique'),
            'mysql'  => DB::statement('ALTER TABLE subscriptions DROP INDEX subscriptions_active_user_unique'),
            default  => null,
        };
    }
};
