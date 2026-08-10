<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('status')->default('pending');
            $table->string('file_path')->nullable()->change();
        });

        DB::table('reports')->whereNotNull('file_path')->update(['status' => 'completed']);
    }

    public function down(): void
    {
        DB::table('reports')->where('status', '!=', 'completed')->update(['file_path' => '']);
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->string('file_path')->nullable(false)->change();
        });
    }
};
