<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agency_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('agency_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('budget_level')->nullable();
            $table->string('status')->default('requested');
            $table->timestamp('admin_approved_at')->nullable();
            $table->timestamp('agency_responded_at')->nullable();
            $table->timestamps();
        });

        Schema::table('trips', function (Blueprint $table) {
            $table->foreignId('agency_assignment_id')->nullable()->constrained('agency_assignments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropForeign(['agency_assignment_id']);
            }
            $table->dropColumn('agency_assignment_id');
        });

        Schema::dropIfExists('agency_assignments');
    }
};
