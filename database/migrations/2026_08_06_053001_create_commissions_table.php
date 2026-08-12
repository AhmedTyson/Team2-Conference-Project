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
        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('source_type', 50);
            $table->unsignedBigInteger('source_id');
            $table->decimal('rate', 5, 4); // e.g. 0.1000 = 10%
            $table->integer('amount_cents');
            $table->string('status', 20)->default('pending');
            $table->timestamp('settled_at')->nullable();
            $table->timestamps();
            $table->index(['source_type', 'source_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
