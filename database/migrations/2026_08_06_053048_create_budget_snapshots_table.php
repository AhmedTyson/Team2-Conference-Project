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
        Schema::create('budget_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->integer('total_budget_cents');
            $table->integer('spent_cents'); // sum of attached item costs
            $table->integer('remaining_cents');
            $table->json('breakdown'); // {"hotels": X, "flights": Y, "restaurants": Z, etc}
            $table->timestamp('recorded_at');
            $table->timestamps();
            $table->index('trip_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_snapshots');
    }
};
