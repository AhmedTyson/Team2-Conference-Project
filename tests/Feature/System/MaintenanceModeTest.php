<?php

namespace Tests\Feature\System;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

/**
 * T2 — PreventRequestsDuringMaintenance middleware is active on api routes.
 *
 * Gap closure for Phase 3 false claim:
 *   "Production middleware added to bootstrap/app.php —
 *    encryptCookies, preventRequestsDuringMaintenance ✅"
 *   Reality: bootstrap/app.php contained only SubstituteBindings and
 *   EnsureUserIsActive. Neither claimed middleware was present.
 *
 * This test puts the application into maintenance mode via `php artisan down`,
 * hits a real api route, asserts a 503 is returned, then brings the app back
 * up. The assertion is against the HTTP response, not the middleware class
 * name appearing in an array — it cannot pass unless the middleware actually
 * runs in the pipeline.
 */
class MaintenanceModeTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        // Always restore the application to normal mode, even if the test fails.
        Artisan::call('up');
        parent::tearDown();
    }

    /**
     * T2 — API routes return 503 while application is in maintenance mode.
     *
     * Uses api/v1/categories (no auth required) so the test isolates
     * the maintenance middleware — not auth middleware.
     */
    public function test_api_route_returns_503_during_maintenance_mode(): void
    {
        // Bring the app down — this writes storage/framework/down.
        Artisan::call('down');

        $response = $this->getJson('/api/categories');

        // Restore immediately so subsequent tests aren't affected.
        Artisan::call('up');

        $response->assertStatus(503);
    }

    /**
     * T2b — API routes return normal responses once maintenance mode is lifted.
     *
     * Proves `artisan up` actually restores functionality — the counterpart
     * check so we know the 503 above was real maintenance mode, not a
     * permanently broken route.
     */
    public function test_api_route_returns_200_after_maintenance_mode_lifted(): void
    {
        Artisan::call('down');
        Artisan::call('up');

        $response = $this->getJson('/api/categories');

        // Categories index should return 200 (unauthenticated public endpoint).
        $response->assertOk();
    }
}
