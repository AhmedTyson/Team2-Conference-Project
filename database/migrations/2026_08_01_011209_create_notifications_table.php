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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title')->nullable(); // Made nullable for native compat
            $table->string('type');
            $table->string('notifiable_type')->nullable();
            $table->unsignedBigInteger('notifiable_id')->nullable();
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->string('status')->default('unread')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->index(['notifiable_type', 'notifiable_id']);
            $table->index(['user_id', 'read_at']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
