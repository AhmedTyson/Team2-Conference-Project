<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('paymob_transaction_id', 100)->unique();
            $table->enum('status', ['paid', 'failed', 'refunded']);
            $table->integer('amount_cents');
            $table->char('currency', 3);
            $table->string('card_type', 50)->nullable();
            $table->string('card_subtype', 50)->nullable();
            $table->string('card_pan', 10)->nullable();
            $table->boolean('hmac_valid');
            $table->json('raw_payload');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
