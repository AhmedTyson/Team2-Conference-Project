<?php

namespace App\Providers;

use App\Models\Attraction;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;
use App\Interfaces\SurveyRepositoryInterface;
use App\Repositories\SurveyRepository;
use App\Interfaces\CountryRepositoryInterface;
use App\Repositories\CountryRepository;
use App\Interfaces\PlanRepositoryInterface;
use App\Repositories\PlanRepository;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            SurveyRepositoryInterface::class,
            SurveyRepository::class
        );

        $this->app->bind(
            CountryRepositoryInterface::class,
            CountryRepository::class
        );

        $this->app->bind(
            PlanRepositoryInterface::class,
            PlanRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Relation::enforceMorphMap([
            'user'        => User::class,
            'hotel'       => Hotel::class,
            'restaurant'  => Restaurant::class,
            'attraction'  => Attraction::class,
            'destination' => Destination::class,
            'flight'      => Flight::class,
        ]);
    }
}
