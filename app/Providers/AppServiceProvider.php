<?php

namespace App\Providers;

use App\Interfaces\CountryRepositoryInterface;
use App\Interfaces\OrderRepositoryInterface;
use App\Interfaces\PaymentGatewayInterface;
use App\Interfaces\PaymentRepositoryInterface;
use App\Interfaces\PlanRepositoryInterface;
use App\Interfaces\SurveyRepositoryInterface;
use App\Models\Attraction;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Plan;
use App\Models\Restaurant;
use App\Models\Trip;
use App\Models\User;
use App\Repositories\CountryRepository;
use App\Repositories\OrderRepository;
use App\Repositories\PaymentRepository;
use App\Repositories\PlanRepository;
use App\Repositories\SurveyRepository;
use App\Services\PaymobGateway;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGatewayInterface::class, PaymobGateway::class);
        $this->app->bind(OrderRepositoryInterface::class, OrderRepository::class);
        $this->app->bind(PaymentRepositoryInterface::class, PaymentRepository::class);
        $this->app->bind(SurveyRepositoryInterface::class, SurveyRepository::class);
        $this->app->bind(CountryRepositoryInterface::class, CountryRepository::class);
        $this->app->bind(PlanRepositoryInterface::class, PlanRepository::class);

        // N-Tier Interfaces
        $this->app->bind(\App\Interfaces\AttractionRepositoryInterface::class, \App\Repositories\AttractionRepository::class);
        $this->app->bind(\App\Interfaces\CategoryRepositoryInterface::class, \App\Repositories\CategoryRepository::class);
        $this->app->bind(\App\Interfaces\ContactMessageRepositoryInterface::class, \App\Repositories\ContactMessageRepository::class);
        $this->app->bind(\App\Interfaces\DestinationRepositoryInterface::class, \App\Repositories\DestinationRepository::class);
        $this->app->bind(\App\Interfaces\FlightRepositoryInterface::class, \App\Repositories\FlightRepository::class);
        $this->app->bind(\App\Interfaces\HotelRepositoryInterface::class, \App\Repositories\HotelRepository::class);
        $this->app->bind(\App\Interfaces\RestaurantRepositoryInterface::class, \App\Repositories\RestaurantRepository::class);
        $this->app->bind(\App\Interfaces\ReviewRepositoryInterface::class, \App\Repositories\ReviewRepository::class);
        $this->app->bind(\App\Interfaces\SettingRepositoryInterface::class, \App\Repositories\SettingRepository::class);
        $this->app->bind(\App\Interfaces\TripRepositoryInterface::class, \App\Repositories\TripRepository::class);
        $this->app->bind(\App\Interfaces\UserRepositoryInterface::class, \App\Repositories\UserRepository::class);
    }

    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(
                $request->ip().'|'.strtolower((string) $request->input('email'))
            );
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        Relation::enforceMorphMap([
            'user' => User::class,
            'hotel' => Hotel::class,
            'restaurant' => Restaurant::class,
            'attraction' => Attraction::class,
            'destination' => Destination::class,
            'flight' => Flight::class,
            'trip' => Trip::class,
            'plan' => Plan::class,
        ]);
    }
}
