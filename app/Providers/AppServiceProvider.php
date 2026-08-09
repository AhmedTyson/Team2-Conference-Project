<?php

namespace App\Providers;

use App\Interfaces\Account\UserRepositoryInterface;
use App\Interfaces\AttractionRepositoryInterface;
use App\Interfaces\CategoryRepositoryInterface;
use App\Interfaces\CountryRepositoryInterface;
use App\Interfaces\DestinationRepositoryInterface;
use App\Interfaces\FlightRepositoryInterface;
use App\Interfaces\HotelRepositoryInterface;
use App\Interfaces\OrderRepositoryInterface;
use App\Interfaces\PaymentGatewayInterface;
use App\Interfaces\PaymentRepositoryInterface;
use App\Interfaces\PlanRepositoryInterface;
use App\Interfaces\RestaurantRepositoryInterface;
use App\Interfaces\ReviewRepositoryInterface;
use App\Interfaces\SurveyRepositoryInterface;
use App\Interfaces\System\ContactMessageRepositoryInterface;
use App\Interfaces\System\SettingRepositoryInterface;
use App\Interfaces\TripRepositoryInterface;
use App\Models\Account\User;
use App\Models\Attraction;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Plan;
use App\Models\Restaurant;
use App\Models\Trip;
use App\Repositories\Account\UserRepository;
use App\Repositories\AttractionRepository;
use App\Repositories\CategoryRepository;
use App\Repositories\CountryRepository;
use App\Repositories\DestinationRepository;
use App\Repositories\FlightRepository;
use App\Repositories\HotelRepository;
use App\Repositories\OrderRepository;
use App\Repositories\PaymentRepository;
use App\Repositories\PlanRepository;
use App\Repositories\RestaurantRepository;
use App\Repositories\ReviewRepository;
use App\Repositories\SurveyRepository;
use App\Repositories\System\ContactMessageRepository;
use App\Repositories\System\SettingRepository;
use App\Repositories\TripRepository;
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
        $this->app->bind(AttractionRepositoryInterface::class, AttractionRepository::class);
        $this->app->bind(CategoryRepositoryInterface::class, CategoryRepository::class);
        $this->app->bind(ContactMessageRepositoryInterface::class, ContactMessageRepository::class);
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
