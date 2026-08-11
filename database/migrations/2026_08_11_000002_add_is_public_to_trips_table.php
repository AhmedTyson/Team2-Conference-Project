<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * SEC-04 (D1 — Option B): Add is_public flag to trips.
     * Fork allowed iff trip.is_public = true OR buyer is the owner.
     * Default false — all existing trips stay private.
     */
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->boolean('is_public')->default(false)->after('is_fork');
        });
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn('is_public');
        });
    }
};
