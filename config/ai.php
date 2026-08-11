<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Rate Limit (per user, per day)
    |--------------------------------------------------------------------------
    |
    | Strict default of 500 requests/day/user across all AI endpoints
    | (enhance, review, concierge). Tune via environment when needed.
    |
    */

    'rate_limit_per_day' => (int) env('AI_RATE_LIMIT_PER_DAY', 500),

];