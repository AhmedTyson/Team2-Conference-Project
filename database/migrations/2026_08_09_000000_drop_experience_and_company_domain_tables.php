<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        if (DB::getDriverName() === 'sqlite') {
            // SQLite workaround for dropping a column with a foreign key
            Schema::dropIfExists('payments');
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->nullable()->constrained()->cascadeOnDelete();
                $table->string('paymob_transaction_id', 100)->unique();
                $table->string('status', 30);
                $table->integer('amount_cents');
                $table->char('currency', 3);
                $table->string('card_type', 50)->nullable();
                $table->string('card_subtype', 50)->nullable();
                $table->string('card_pan', 20)->nullable();
                $table->boolean('hmac_valid');
                $table->json('raw_payload');
                $table->timestamps();
            });
        } else {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropForeign(['booking_id']);
                $table->dropColumn('booking_id');
            });
        }

        // First batch
        Schema::dropIfExists('experience_providers');
        Schema::dropIfExists('experiences');
        Schema::dropIfExists('entity_views');
        Schema::dropIfExists('companies');

        // Second batch
        Schema::dropIfExists('commissions');
        Schema::dropIfExists('booking_items');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('transactions');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
    }
};
