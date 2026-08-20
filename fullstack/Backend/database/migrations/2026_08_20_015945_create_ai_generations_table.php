<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('trip_id')->nullable()->constrained('trips')->nullOnDelete();
            $table->string('city');
            $table->unsignedSmallInteger('no_of_days')->default(4);
            $table->string('travel_style')->nullable();
            $table->string('budget_tier')->nullable();
            $table->enum('status', ['success', 'failed', 'fallback'])->default('success');
            $table->text('error_message')->nullable();
            $table->unsignedSmallInteger('items_count')->default(0);
            $table->boolean('used_fallback')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_generations');
    }
};
