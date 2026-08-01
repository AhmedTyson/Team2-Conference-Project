<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Interfaces\SurveyRepositoryInterface;
use App\Repositories\SurveyRepository;

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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
