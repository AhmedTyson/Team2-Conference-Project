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
        Schema::create('flights',function(Blueprint $table){
            $table->id();

            

            
            $table->string('airline')->nullable();
            $table->string('flight_number')->nullable();
            $table->string('departure_airport');
            $table->string('arrival_airport');
            $table->dateTime('departure_date');
            $table->dateTime('arrival_date');
            $table->decimal('price')->nullable();
            $table->string('booking_status')->nullable();
            $table->timestamps();
        
        
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
            Schema::dropIfExists('flights');

       
    }
};
