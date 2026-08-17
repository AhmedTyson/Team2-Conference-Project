<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * TelescopeServiceProvider — loaded only when Telescope is installed.
 *
 * Telescope is a require-dev package. In production (--no-dev install),
 * the TelescopeApplicationServiceProvider class does not exist.
 * This guard prevents a fatal crash when running without dev dependencies.
 */

// Only define the class if the Telescope base class is available (local dev only)
if (class_exists(\Laravel\Telescope\TelescopeApplicationServiceProvider::class)) {

    class TelescopeServiceProvider extends \Laravel\Telescope\TelescopeApplicationServiceProvider
    {
        /**
         * Register any application services.
         */
        public function register(): void
        {
            $this->hideSensitiveRequestDetails();

            $isLocal = $this->app->environment('local');

            \Laravel\Telescope\Telescope::filter(function (\Laravel\Telescope\IncomingEntry $entry) use ($isLocal) {
                return $isLocal ||
                       $entry->isReportableException() ||
                       $entry->isFailedRequest() ||
                       $entry->isFailedJob() ||
                       $entry->isScheduledTask() ||
                       $entry->hasMonitoredTag();
            });
        }

        /**
         * Prevent sensitive request details from being logged by Telescope.
         */
        protected function hideSensitiveRequestDetails(): void
        {
            if ($this->app->environment('local')) {
                return;
            }

            \Laravel\Telescope\Telescope::hideRequestParameters(['_token']);

            \Laravel\Telescope\Telescope::hideRequestHeaders([
                'cookie',
                'x-csrf-token',
                'x-xsrf-token',
            ]);
        }

        /**
         * Register the Telescope gate.
         */
        protected function gate(): void
        {
            \Illuminate\Support\Facades\Gate::define('viewTelescope', function ($user) {
                return in_array($user->email, [
                    //
                ]);
            });
        }
    }

} else {

    // Production stub: Telescope not installed, register a no-op provider
    class TelescopeServiceProvider extends ServiceProvider
    {
        public function register(): void {}
        public function boot(): void {}
    }

}
