<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Relation::enforceMorphMap([
            'hotel'       => \App\Models\Hotel::class,
            'restaurant'  => \App\Models\Restaurant::class,
            'attraction'  => \App\Models\Attraction::class,
            'destination' => \App\Models\Destination::class,
            'flight'      => \App\Models\Flight::class,
        ]);
    }
}
