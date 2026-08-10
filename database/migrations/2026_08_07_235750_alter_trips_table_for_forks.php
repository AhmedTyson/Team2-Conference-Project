<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->foreignId('parent_trip_id')->nullable()->after('status')->constrained('trips')->nullOnDelete();
            $table->foreignId('original_trip_id')->nullable()->after('parent_trip_id')->constrained('trips')->nullOnDelete();
            $table->boolean('is_fork')->default(false)->after('original_trip_id');
            $table->string('source_version_id')->nullable()->after('is_fork');
        });
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropForeign(['parent_trip_id']);
            $table->dropForeign(['original_trip_id']);
            $table->dropColumn(['parent_trip_id', 'original_trip_id', 'is_fork', 'source_version_id']);
        });
    }
};
