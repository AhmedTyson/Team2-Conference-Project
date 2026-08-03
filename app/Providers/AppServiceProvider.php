<?php

namespace App\Providers;

use App\Models\Attraction;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Restaurant;
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
            'hotel'       => Hotel::class,
            'restaurant'  => Restaurant::class,
            'attraction'  => Attraction::class,
            'destination' => Destination::class,
            'flight'      => Flight::class,
        ]);
    }
}
