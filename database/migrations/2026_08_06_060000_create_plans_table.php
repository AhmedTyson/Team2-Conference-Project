<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\BillingCycle;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->unsignedBigInteger('price_cents')->default(0);
            $table->string('currency', 3)->default('EGP');
            $table->string('billing_cycle', 10)->default(BillingCycle::MONTHLY->value);
            $table->unsignedInteger('ai_quota_monthly')->default(0);
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
