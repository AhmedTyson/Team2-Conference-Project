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
            $table->foreignId('order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('paymob_transaction_id', 100)->unique();
            $table->string('status', 30)->default('pending');
            $table->integer('amount_cents');
            $table->char('currency', 3);
            $table->text('client_secret')->nullable();
            $table->text('checkout_url')->nullable();
            $table->boolean('hmac_valid');
            $table->text('raw_payload')->nullable();
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
