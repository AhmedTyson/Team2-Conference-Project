<?php

// Account
use App\Http\Controllers\Account\AdminUserController;
use App\Http\Controllers\Account\AuthController;

// Catalog
use App\Http\Controllers\Catalog\AdminAttractionController;
use App\Http\Controllers\Catalog\AdminCategoryController;
use App\Http\Controllers\Catalog\AdminCountryController;
use App\Http\Controllers\Catalog\AdminDestinationController;
use App\Http\Controllers\Catalog\AdminFlightController;
use App\Http\Controllers\Catalog\AdminHotelController;
use App\Http\Controllers\Catalog\AdminRestaurantController;
use App\Http\Controllers\Catalog\AttractionController;
use App\Http\Controllers\Catalog\CategoryController;
use App\Http\Controllers\Catalog\DestinationController;
use App\Http\Controllers\Catalog\FlightController;
use App\Http\Controllers\Catalog\HotelController;
use App\Http\Controllers\Catalog\RestaurantController;

// Commerce
use App\Http\Controllers\Commerce\AdminAnalyticsController;
use App\Http\Controllers\Commerce\CheckoutController;
use App\Http\Controllers\Commerce\AgencyRequestController;
use App\Http\Controllers\Commerce\AdminAgencyController;
use App\Http\Controllers\Commerce\AgencyAssignmentController;
use App\Http\Controllers\Commerce\PaymobWebhookController;
use App\Http\Controllers\Commerce\PlanController;

// System
use App\Http\Controllers\System\AdminNotificationController;
use App\Http\Controllers\System\ContactController;
use App\Http\Controllers\System\ContactMessageController;
use App\Http\Controllers\System\DashboardController;
use App\Http\Controllers\System\NotificationController;
use App\Http\Controllers\System\ReportController;
use App\Http\Controllers\System\SettingController;
use App\Http\Controllers\System\SiteSettingsController;
use App\Http\Controllers\System\SurveyController;
use App\Http\Controllers\System\WeatherController;
use App\Http\Controllers\System\FlagController;
use App\Http\Controllers\System\AdminFlagController;
// Trips
use App\Http\Controllers\Trips\AdminReviewController;
use App\Http\Controllers\Trips\AdminTripController;
use App\Http\Controllers\Trips\AIController;
use App\Http\Controllers\Trips\InteractionController;
use App\Http\Controllers\Trips\MapController;
use App\Http\Controllers\Trips\TripController;

use App\Services\GroqService;
use Illuminate\Support\Facades\Route;

// ============================================================
// ACCOUNT
// ============================================================

// ---- Public Auth ----
Route::post('/register', [AuthController::class, 'register'])->middleware(['throttle:register']);
Route::post('/login', [AuthController::class, 'login'])->middleware(['throttle:login'])->name('login');
Route::post('/forgot-password', [AuthController::class, 'forgetPassword'])->middleware(['throttle:3,10']);
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware(['throttle:5,1'])->name('password.reset');

// ---- Email verification (signed link)
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed'])
    ->name('verification.verify');

// ---- Authenticated session & profile
Route::middleware(['auth:api'])->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware(['throttle:15,1']);
    Route::get('/email/verify-notice', [AuthController::class, 'verificationNotice'])
        ->name('verification.notice');
    Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])
        ->middleware(['throttle:6,1'])
        ->name('verification.resend');
    Route::patch('/v1/profile', [AuthController::class, 'updateProfile']);
});

// ---- Admin: users
Route::middleware(['auth:api'])->prefix('v1/admin')->name('admin.')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index'])->middleware('permission:manage users');
    Route::get('/users/{user}', [AdminUserController::class, 'show'])->middleware('permission:manage users');
    Route::post('/users', [AdminUserController::class, 'store'])->middleware('permission:manage users');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->middleware('permission:manage users');
    Route::patch('/users/{user}/active', [AdminUserController::class, 'active'])->middleware('permission:manage users');
    Route::patch('/users/{user}/block', [AdminUserController::class, 'block'])->middleware('permission:manage users');
});

// ============================================================
// CATALOG
// ============================================================

// ---- Public explorer
Route::prefix('v1')->group(function () {
    // Categories
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/categories/{category}', [CategoryController::class, 'show'])->name('categories.show');

    // Destinations
    Route::get('/destinations', [DestinationController::class, 'index']);
    Route::get('/destinations/{id}', [DestinationController::class, 'show']);

    // Hotels
    Route::get('/hotels', [HotelController::class, 'index']);
    Route::get('/hotels/{id}', [HotelController::class, 'show']);

    // Flights
    Route::get('/flights', [FlightController::class, 'index']);
    Route::get('/flights/{id}', [FlightController::class, 'show']);

    // Restaurants
    Route::get('/restaurants', [RestaurantController::class, 'index']);
    Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);

    // Attractions
    Route::get('/attractions', [AttractionController::class, 'index']);
    Route::get('/attractions/{id}', [AttractionController::class, 'show']);

    // Public site settings (cached, no auth)
    Route::get('/site-settings', [SiteSettingsController::class, 'index'])->name('site-settings.index');
});

// ---- Admin CRUD
Route::middleware(['auth:api'])->prefix('v1/admin')->name('admin.')->group(function () {
    // Categories
    Route::get('/categories', [AdminCategoryController::class, 'index'])
        ->middleware('permission:manage categories')->name('categories.index');
    Route::post('/categories', [AdminCategoryController::class, 'store'])
        ->middleware('permission:manage categories')->name('categories.store');
    Route::put('/categories/{category}', [AdminCategoryController::class, 'update'])
        ->middleware('permission:manage categories')->name('categories.update');
    Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])
        ->middleware('permission:manage categories')->name('categories.destroy');

    // Countries
    Route::get('/countries', [AdminCountryController::class, 'index'])->middleware('permission:manage countries');
    Route::post('/countries', [AdminCountryController::class, 'store'])->middleware('permission:manage countries');
    Route::put('/countries/{id}', [AdminCountryController::class, 'update'])->middleware('permission:manage countries');
    Route::delete('/countries/{id}', [AdminCountryController::class, 'destroy'])->middleware('permission:manage countries');

    // Destinations
    Route::get('/destinations', [AdminDestinationController::class, 'index'])
        ->middleware('permission:manage destinations')->name('destinations.index');
    Route::post('/destinations', [AdminDestinationController::class, 'store'])
        ->middleware('permission:manage destinations')->name('destinations.store');
    Route::put('/destinations/{id}', [AdminDestinationController::class, 'update'])
        ->middleware('permission:manage destinations')->name('destinations.update');
    Route::delete('/destinations/{id}', [AdminDestinationController::class, 'destroy'])
        ->middleware('permission:manage destinations')->name('destinations.destroy');

    // Flights
    Route::get('/flights', [AdminFlightController::class, 'index'])
        ->middleware('permission:manage flights');
    Route::post('/flights', [AdminFlightController::class, 'store'])
        ->middleware('permission:manage flights');
    Route::put('/flights/{id}', [AdminFlightController::class, 'update'])
        ->middleware('permission:manage flights');
    Route::delete('/flights/{id}', [AdminFlightController::class, 'destroy'])
        ->middleware('permission:manage flights');

    // Hotels
    Route::get('/hotels', [AdminHotelController::class, 'index'])->middleware('permission:manage hotels');
    Route::post('/hotels', [AdminHotelController::class, 'store'])->middleware('permission:manage hotels');
    Route::put('/hotels/{id}', [AdminHotelController::class, 'update'])->middleware('permission:manage hotels');
    Route::delete('/hotels/{id}', [AdminHotelController::class, 'destroy'])->middleware('permission:manage hotels');

    // Attractions
    Route::get('/attractions', [AdminAttractionController::class, 'index'])->middleware('permission:manage attractions');
    Route::post('/attractions', [AdminAttractionController::class, 'store'])->middleware('permission:manage attractions');
    Route::put('/attractions/{id}', [AdminAttractionController::class, 'update'])->middleware('permission:manage attractions');
    Route::delete('/attractions/{id}', [AdminAttractionController::class, 'destroy'])->middleware('permission:manage attractions');

    // Restaurants
    Route::get('/restaurants', [AdminRestaurantController::class, 'index'])->middleware('permission:manage restaurants');
    Route::post('/restaurants', [AdminRestaurantController::class, 'store'])->middleware('permission:manage restaurants');
    Route::put('/restaurants/{id}', [AdminRestaurantController::class, 'update'])->middleware('permission:manage restaurants');
    Route::delete('/restaurants/{id}', [AdminRestaurantController::class, 'destroy'])->middleware('permission:manage restaurants');
});

// ============================================================
// TRIPS
// ============================================================

// ---- Maps
Route::prefix('v1')->group(function () {
    Route::get('/maps/destination/{destination}', [MapController::class, 'destination']);
    Route::get('/maps/trip/{trip}', [MapController::class, 'trip'])->middleware('auth:api');
});

// ---- Trip planner (authenticated)
Route::middleware(['auth:api'])->prefix('v1/trips')->group(function () {
    Route::get('/create', [TripController::class, 'create']);
    Route::post('/', [TripController::class, 'store']);
    Route::post('/{trip}/attach/{type}', [TripController::class, 'attach'])->middleware('auth:api');
    Route::delete('/{trip}/detach/{id}', [TripController::class, 'detach'])->middleware('auth:api');
});

// Trip forking (original route lived outside the v1 prefix)
Route::post('/trips/{trip}/fork', [TripController::class, 'fork'])->middleware(['auth:api']);

// Owner trip view (registered after literal /create so the literal wins)
Route::get('/v1/trips/{trip}', [TripController::class, 'show'])->middleware(['auth:api']);

// ---- Interaction & reviews
Route::middleware(['auth:api'])->group(function () {
    Route::post('/v1/favourites/{type}/{id}', [InteractionController::class, 'toggleFavourite']);
    Route::post('/v1/reviews/{type}/{id}', [InteractionController::class, 'storeReview']);
    Route::delete('/v1/reviews/{id}', [InteractionController::class, 'destroyReview']);
});

// ---- AI trip assistant
Route::post('/review', [GroqService::class, 'generateAi'])
    ->middleware(['auth:api', 'permission:generate ai itineraries']);
Route::get('/review/{id}', [AIController::class, 'review'])
    ->middleware('auth:api');

// ---- Admin: trips & reviews moderation
Route::middleware(['auth:api'])->prefix('v1/admin')->name('admin.')->group(function () {
    // Trips
    Route::get('/trips', [AdminTripController::class, 'index'])->middleware('permission:manage trips');
    Route::post('/trips', [AdminTripController::class, 'store'])->middleware('permission:manage trips');
    Route::put('/trips/{id}', [AdminTripController::class, 'update'])->middleware('permission:manage trips');
    Route::delete('/trips/{id}', [AdminTripController::class, 'destroy'])->middleware('permission:manage trips');

    // Reviews
    Route::get('/reviews', [AdminReviewController::class, 'index'])->middleware('permission:manage reviews');
    Route::patch('/reviews/{id}/approve', [AdminReviewController::class, 'approve'])->middleware('permission:manage reviews');
    Route::patch('/reviews/{id}/reject', [AdminReviewController::class, 'reject'])->middleware('permission:manage reviews');
    Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy'])->middleware('permission:manage reviews');
});

// ============================================================
// COMMERCE
// ============================================================

// ---- Plans & subscriptions
Route::middleware(['auth:api'])->prefix('v1')->name('plans.')->group(function () {
    Route::post('/admin/set-plans', [PlanController::class, 'setPlans'])
        ->middleware('permission:manage plans');

    Route::get('/plans', [PlanController::class, 'index'])
        ->middleware('permission:get plans');
    Route::post('/me/subscribe', [PlanController::class, 'subscribe'])
        ->middleware('permission:subscribe to plans');
    Route::post('/me/upgrade', [PlanController::class, 'upgrade'])
        ->middleware('permission:upgrade plans');
    Route::post('/me/subscription/cancel', [PlanController::class, 'cancel'])
        ->middleware('permission:cancel subscription');
    Route::get('/me/subscription', [PlanController::class, 'subscription'])
        ->middleware('permission:view my subscription');
});

// ---- Checkout
Route::middleware(['auth:api'])->prefix('v1/checkout')->name('checkout.')->group(function () {
    Route::post('/initiate', [CheckoutController::class, 'initiate'])->name('initiate');
});

// ---- Paymob webhooks (no auth — provider signature verified in controller)
Route::prefix('v1/paymob')->name('paymob-v1.')->group(function () {
    Route::post('/webhook', [PaymobWebhookController::class, 'handle'])->name('webhook');
    Route::get('/callback', [PaymobWebhookController::class, 'callback'])->name('callback');
});

// ---- Admin: revenue analytics
Route::middleware(['auth:api'])->prefix('v1/admin')->name('admin.')->group(function () {
    Route::get('/analytics/revenue', [AdminAnalyticsController::class, 'revenue'])
        ->middleware('permission:view analytics')->name('analytics.revenue');
    Route::get('/analytics', [AdminAnalyticsController::class, 'index'])
        ->middleware('permission:view analytics')->name('analytics.index');
});

// ============================================================
// SYSTEM
// ============================================================

// ---- Public contacts & weather
Route::post('/v1/contacts', [ContactController::class, 'store']);
Route::get('/weather', [WeatherController::class, 'show']);

// ---- Surveys (authenticated)
Route::middleware(['auth:api'])->group(function () {
    Route::apiResource('surveys', SurveyController::class);
});

// ---- Dashboard
Route::middleware(['auth:api'])->prefix('v1/dashboard')->name('dashboard.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('index');
    Route::get('/trips', [DashboardController::class, 'trips'])->name('trips');
    Route::get('/favourites', [DashboardController::class, 'favourites'])->name('favourites');
});

// ---- Notifications
Route::middleware(['auth:api'])->prefix('v1/notifications')->name('notifications.')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::patch('/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead']);
});

// ---- My reports
Route::middleware(['auth:api'])->group(function () {
    Route::get('/me/reports', [ReportController::class, 'myReports']);
});

// ---- Admin
Route::middleware(['auth:api', 'role:admin|super_admin'])->prefix('v1/admin/notifications')->name('admin.notifications.')->group(function () {
    Route::get('/', [AdminNotificationController::class, 'index']);
});

Route::middleware(['auth:api'])->prefix('v1/admin')->name('admin.')->group(function () {
    // Contact inbox
    Route::get('/contacts', [ContactMessageController::class, 'index'])
        ->middleware('permission:manage contacts')->name('contacts.index');
    Route::patch('/contacts/{id}/read', [ContactMessageController::class, 'markAsRead'])
        ->middleware('permission:manage contacts')->name('contacts.read');
    Route::patch('/contacts/{id}/resolve', [ContactMessageController::class, 'markAsResolved'])
        ->middleware('permission:manage contacts')->name('contacts.resolve');

    // Settings
    Route::get('/settings', [SettingController::class, 'index'])
        ->middleware('permission:manage settings')->name('settings.index');
    Route::put('/settings', [SettingController::class, 'update'])
        ->middleware('permission:manage settings')->name('settings.update');
    Route::patch('/settings/{key}', [SettingController::class, 'patchKey'])
        ->middleware('permission:manage settings')->name('settings.patchKey');
});

// ---- Reports
Route::middleware(['auth:api', 'role:admin|super_admin'])
    ->prefix('v1/admin')
    ->group(function () {
        Route::get('/reports', [ReportController::class, 'index']);
        Route::post('/reports/generate', [ReportController::class, 'generate']);
        Route::get('/reports/{id}/download', [ReportController::class, 'download']);
    });


Route::middleware(['auth:api'])->prefix('v1')->group(function () {
    Route::post('/agency-requests', [AgencyRequestController::class, 'store']);
    Route::post('/admin/agency-requests/{assignment}/approve', [AdminAgencyController::class, 'approve'])->middleware('role:admin|super_admin');
    Route::post('/agency/assignments/{assignment}/approve', [AgencyAssignmentController::class, 'approve'])->middleware('role:agency');
    Route::post('/agency/assignments/{assignment}/decline', [AgencyAssignmentController::class, 'decline'])->middleware('role:agency');
    Route::post('/agency/assignments/{assignment}/trips', [AgencyAssignmentController::class, 'createTrip'])->middleware('role:agency');
    Route::get('/agency/assignments', [AgencyAssignmentController::class, 'index'])->middleware('role:agency');


    // Plans
    Route::post('/agency-assignments/{assignment}/report', [FlagController::class, 'store'])->middleware('auth:api');
    Route::get('/admin/flags', [AdminFlagController::class, 'index'])->middleware('role:admin|super_admin');
    Route::post('/admin/flags/{flag}/approve', [AdminFlagController::class, 'approve'])->middleware('role:admin|super_admin');
    Route::post('/admin/flags/{flag}/decline', [AdminFlagController::class, 'decline'])->middleware('role:admin|super_admin');
});

