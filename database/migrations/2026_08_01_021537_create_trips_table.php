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
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('travel_style');
            $table->json('interests')->nullable();

            $table->unsignedInteger('no_of_travelers');

            $table->decimal('budget', 10, 2);

            $table->unsignedInteger('no_of_days');

            $table->date('start_date');
            $table->date('end_date');

            $table->enum('status', [
                'pending',
                'planning',
                'completed',
                'cancelled'
            ])->default('pending');

            $table->decimal('estimated_cost', 10, 2)->nullable();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
