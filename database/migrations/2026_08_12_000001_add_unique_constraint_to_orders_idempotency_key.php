<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The existing non-unique index was already dropped by the failed
        // first attempt. Just add the unique constraint now.
        Schema::table('orders', function (Blueprint $table) {
            $table->unique(['user_id', 'idempotency_key'], 'orders_user_idempotency_unique');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique('orders_user_idempotency_unique');
            $table->index(['user_id', 'idempotency_key']);
        });
    }
};
