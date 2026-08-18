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

            $table->string('status')->default('pending');

            $table->decimal('estimated_cost', 10, 2)->nullable();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_trip_id')->nullable()->constrained('trips')->nullOnDelete();
            $table->foreignId('original_trip_id')->nullable()->constrained('trips')->nullOnDelete();
            $table->boolean('is_fork')->default(false);
            $table->boolean('is_public')->default(false);
            $table->string('source_version_id')->nullable();
            $table->string('confirmation_code', 8)->unique()->nullable();
            $table->softDeletes();
            $table->index('user_id', 'trips_user_id_index');
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

