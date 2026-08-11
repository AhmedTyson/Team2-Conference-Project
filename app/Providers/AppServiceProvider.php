<?php

namespace App\Providers;

use App\Interfaces\Account\UserRepositoryInterface;
use App\Interfaces\Catalog\AttractionRepositoryInterface;
use App\Interfaces\Catalog\CategoryRepositoryInterface;
use App\Interfaces\Catalog\CountryRepositoryInterface;
use App\Interfaces\Catalog\DestinationRepositoryInterface;
use App\Interfaces\Catalog\FlightRepositoryInterface;
use App\Interfaces\Catalog\HotelRepositoryInterface;
use App\Interfaces\Catalog\RestaurantRepositoryInterface;
use App\Interfaces\Commerce\OrderRepositoryInterface;
use App\Interfaces\Commerce\AgencyAssignmentRepositoryInterface;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Interfaces\Commerce\PaymentRepositoryInterface;
use App\Interfaces\Commerce\PlanRepositoryInterface;
use App\Interfaces\System\ContactMessageRepositoryInterface;
use App\Interfaces\System\FlagRepositoryInterface;
use App\Interfaces\System\SettingRepositoryInterface;
use App\Interfaces\System\SurveyRepositoryInterface;
use App\Interfaces\Trips\ReviewRepositoryInterface;
use App\Interfaces\Trips\TripRepositoryInterface;
use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Flight;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Commerce\Plan;
use App\Models\Trips\Trip;
use App\Repositories\Account\UserRepository;
use App\Repositories\Catalog\AttractionRepository;
use App\Repositories\Catalog\CategoryRepository;
use App\Repositories\Catalog\CountryRepository;
use App\Repositories\Catalog\DestinationRepository;
use App\Repositories\Catalog\FlightRepository;
use App\Repositories\Catalog\HotelRepository;
use App\Repositories\Catalog\RestaurantRepository;
use App\Repositories\Commerce\OrderRepository;
use App\Repositories\Commerce\AgencyAssignmentRepository;
use App\Repositories\Commerce\PaymentRepository;
use App\Repositories\Commerce\PlanRepository;
use App\Repositories\System\ContactMessageRepository;
use App\Repositories\System\FlagRepository;
use App\Repositories\System\SettingRepository;
use App\Repositories\System\SurveyRepository;
use App\Repositories\Trips\ReviewRepository;
use App\Repositories\Trips\TripRepository;
use App\Services\Commerce\PaymobGateway;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(\App\Interfaces\Commerce\AgencyAssignmentRepositoryInterface::class, \App\Repositories\Commerce\AgencyAssignmentRepository::class);
        $this->app->bind(PaymentGatewayInterface::class, PaymobGateway::class);
        $this->app->bind(OrderRepositoryInterface::class, OrderRepository::class);
        $this->app->bind(PaymentRepositoryInterface::class, PaymentRepository::class);
        $this->app->bind(SurveyRepositoryInterface::class, SurveyRepository::class);
        $this->app->bind(CountryRepositoryInterface::class, CountryRepository::class);
        $this->app->bind(PlanRepositoryInterface::class, PlanRepository::class);

        // N-Tier Interfaces
        $this->app->bind(AttractionRepositoryInterface::class, AttractionRepository::class);
        $this->app->bind(CategoryRepositoryInterface::class, CategoryRepository::class);
        $this->app->bind(ContactMessageRepositoryInterface::class, ContactMessageRepository::class);
        $this->app->bind(FlagRepositoryInterface::class, FlagRepository::class);
        $this->app->bind(DestinationRepositoryInterface::class, DestinationRepository::class);
        $this->app->bind(FlightRepositoryInterface::class, FlightRepository::class);
        $this->app->bind(HotelRepositoryInterface::class, HotelRepository::class);
        $this->app->bind(RestaurantRepositoryInterface::class, RestaurantRepository::class);
        $this->app->bind(ReviewRepositoryInterface::class, ReviewRepository::class);
        $this->app->bind(SettingRepositoryInterface::class, SettingRepository::class);
        $this->app->bind(TripRepositoryInterface::class, TripRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
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

        RateLimiter::for('ai', function (Request $request) {
            $key = $request->user()?->id ?? $request->ip();

            return Limit::perDay(config('ai.rate_limit_per_day'))->by($key);
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


