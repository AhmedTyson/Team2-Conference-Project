<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->foreignId('region_id')->nullable()->constrained()->nullOnDelete();
            $table->index('region_id');
        });
    }

    public function down(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->dropIndex(['region_id']);
            $table->dropForeign(['region_id']);
            $table->dropColumn('region_id');
        });
    }
};
