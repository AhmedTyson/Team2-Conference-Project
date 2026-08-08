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
        Schema::create('experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('destination_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description');
            $table->integer('price_cents');
            $table->integer('duration_minutes')->nullable();
            $table->integer('max_participants')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->tinyInteger('eco_score')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('experience');
    }
};
