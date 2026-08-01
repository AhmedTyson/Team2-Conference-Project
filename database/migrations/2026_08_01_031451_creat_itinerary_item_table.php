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
        Schema::create('itinerary_item',function (Blueprint $table){
            $table->id();

            $table->foreignId('trip_id')->constrained()->onDelete('cascade');
            $table->morphs('itemable');

            $table->decimal('day_number');
            $table->decimal('item_order');
            $table->string('type');
            $table->string('time_slot');  
            $table->string('title');           
            $table->string('notes');   
            $table->decimal('estimated_cost');       
            $table-> timestamps();                          
        });                                       
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('itinerary_item');
    }
};
