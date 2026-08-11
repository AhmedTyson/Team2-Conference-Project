<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// SEC-09: transition stale pending orders (30-minute window exceeded) to expired.
Schedule::command('orders:expire-stale')->everyMinute();
