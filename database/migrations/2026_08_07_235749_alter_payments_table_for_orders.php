<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedBigInteger('booking_id')->nullable()->change();
            $table->foreignId('order_id')->nullable()->after('booking_id')->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedBigInteger('booking_id')->nullable(false)->change();
            $table->dropForeign(['order_id']);
            $table->dropColumn('order_id');
        });
    }
};
