<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Drop custom columns (already dropped due to previous sqlite execution)
            // $table->dropColumn(['title', 'body', 'status']);
            
            // Add native Laravel columns
            $table->string('notifiable_type')->nullable()->after('type');
            $table->unsignedBigInteger('notifiable_id')->nullable()->after('notifiable_type');
            $table->timestamp('read_at')->nullable()->after('data');
            
            $table->index(['notifiable_type', 'notifiable_id']);
            $table->index(['user_id', 'read_at']); // For fast unread counts
        });

        // SQLite doesn't easily support changing primary keys, but for other DBs we'd change id to UUID.
        // Actually, let's just update the original migration since it's cleaner for fresh test setups.
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('title');
            $table->text('body');
            $table->string('status')->default('unread');
            
            $table->dropIndex(['notifiable_type', 'notifiable_id']);
            $table->dropIndex(['user_id', 'read_at']);
            
            $table->dropColumn(['notifiable_type', 'notifiable_id', 'read_at']);
        });
    }
};
