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
        Schema::table('users', function (Blueprint $table) {
            $table->text('bio')->nullable()->after('phone');
            $table->string('country', 100)->nullable()->after('bio');
            $table->string('address', 255)->nullable()->after('country');
            $table->string('preferred_currency', 10)->default('USD')->after('address');
            $table->string('emergency_contact')->nullable()->after('preferred_currency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bio', 'country', 'address', 'preferred_currency', 'emergency_contact']);
        });
    }
};
