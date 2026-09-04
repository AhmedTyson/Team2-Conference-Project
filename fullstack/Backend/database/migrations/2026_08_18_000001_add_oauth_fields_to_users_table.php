<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id', 128)->nullable()->after('email');
            $table->string('facebook_id', 128)->nullable()->after('google_id');
            $table->text('avatar')->nullable()->after('facebook_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'facebook_id', 'avatar']);
        });
    }
};