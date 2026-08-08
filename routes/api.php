<?php

use App\Http\Controllers\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\AttractionController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\InteractionController;
use App\Http\Controllers\SurveyController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FlightController;

// Admin Controllers
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminReviewController;
use App\Http\Controllers\Admin\AdminTripController;
use App\Http\Controllers\Admin\ContactMessageController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\AdminHotelController;
use App\Http\Controllers\Admin\AdminRestaurantController;
use App\Http\Controllers\Admin\AdminCountryController;
use App\Http\Controllers\Admin\DestinationController as AdminDestinationController;
use App\Http\Controllers\Admin\AdminAttractionController;
use App\Http\Controllers\SiteSettingsController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\Admin\AdminAnalyticsController;
use App\Http\Controllers\Admin\AdminFlightController;

// Category Routes
Route::prefix('v1')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/categories/{category}', [CategoryController::class, 'show'])->name('categories.show');
});

// Admin Categories (using CategoryController)
Route::middleware(['auth:api'])->prefix('v1/admin')->name('admin.')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index'])
        ->middleware('permission:manage categories')->name('categories.index');
    Route::post('/categories', [CategoryController::class, 'store'])
        ->middleware('permission:manage categories')->name('categories.store');
    Route::put('/categories/{category}', [CategoryController::class, 'update'])
        ->middleware('permission:manage categories')->name('categories.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])
        ->middleware('permission:manage categories')->name('categories.destroy');
});

// Public Auth Routes 
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/forgot-password', [AuthController::class, 'forgetPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');

// Public Contact
Route::post('/v1/contacts', [ContactController::class, 'store']);

// Verification email 
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed'])
    ->name('verification.verify');

// Authenticated Routes
Route::middleware(['auth:api'])->group(function () {
    // Auth & Profile
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/email/verify-notice', [AuthController::class, 'verificationNotice'])
        ->name('verification.notice');
    Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])
        ->middleware(['throttle:6,1'])
        ->name('verification.resend');
    Route::patch('/v1/profile', [AuthController::class, 'updateProfile']);
    // User Interactions (Community)
    Route::post('/v1/favourites/{type}/{id}', [InteractionController::class, 'toggleFavourite']);
    Route::post('/v1/reviews/{type}/{id}', [InteractionController::class, 'storeReview']);
    Route::delete('/v1/reviews/{id}', [InteractionController::class, 'destroyReview']);

    // Surveys
    Route::apiResource('surveys', SurveyController::class);

    // Trip Planner
    Route::get('/v1/trips/create', [TripController::class, 'create']);
    Route::post('/v1/trips', [TripController::class, 'store']);
    Route::post('/v1/trips/{trip}/attach/{type}', [TripController::class, 'attach'])->middleware('auth:api');
    Route::delete('/v1/trips/{trip}/detach/{id}', [TripController::class, 'detach'])->middleware('auth:api');

    // Dashboard Routes
    Route::prefix('v1/dashboard')->name('dashboard.')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('index');
        Route::get('/trips', [DashboardController::class, 'trips'])->name('trips');
        Route::get('/favourites', [DashboardController::class, 'favourites'])->name('favourites');
    });

    //trip forking route
    Route::middleware('auth:api')->group(function () {
    Route::post('/trips/{trip}/fork', [TripController::class, 'fork']);
});

    // Admin Routes
    Route::prefix('v1/admin')->name('admin.')->group(function () {
        // Users Management (Sarah)
        Route::get('/users', [AdminUserController::class, 'index'])->middleware('permission:manage users');
        Route::get('/users/{user}', [AdminUserController::class, 'show'])->middleware('permission:manage users');
        Route::post('/users', [AdminUserController::class, 'store'])->middleware('permission:manage users');
        Route::put('/users/{user}', [AdminUserController::class, 'update'])->middleware('permission:manage users');
        Route::patch('/users/{user}/active', [AdminUserController::class, 'active'])->middleware('permission:manage users');
        Route::patch('/users/{user}/block', [AdminUserController::class, 'block'])->middleware('permission:manage users');

        // Reviews Moderation (Lojy)
        Route::get('/reviews', [AdminReviewController::class, 'index'])->middleware('permission:manage reviews');
        Route::patch('/reviews/{id}/approve', [AdminReviewController::class, 'approve'])->middleware('permission:manage reviews');
        Route::patch('/reviews/{id}/reject', [AdminReviewController::class, 'reject'])->middleware('permission:manage reviews');
        Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy'])->middleware('permission:manage reviews');

        // Trips Management (Hana)
        Route::get('/trips', [AdminTripController::class, 'index'])->middleware('permission:manage trips');
        Route::post('/trips', [AdminTripController::class, 'store'])->middleware('permission:manage trips');
        Route::put('/trips/{id}', [AdminTripController::class, 'update'])->middleware('permission:manage trips');
        Route::delete('/trips/{id}', [AdminTripController::class, 'destroy'])->middleware('permission:manage trips');

        // Destinations Management (Tyson)
        Route::get('/destinations', [AdminDestinationController::class, 'index'])
            ->middleware('permission:manage destinations')->name('destinations.index');
        Route::post('/destinations', [AdminDestinationController::class, 'store'])
            ->middleware('permission:manage destinations')->name('destinations.store');
        Route::put('/destinations/{id}', [AdminDestinationController::class, 'update'])
            ->middleware('permission:manage destinations')->name('destinations.update');
        Route::delete('/destinations/{id}', [AdminDestinationController::class, 'destroy'])
            ->middleware('permission:manage destinations')->name('destinations.destroy');

            
        // Admin Flights (Hana)
        Route::get('flights', [AdminFlightController::class, 'index'])
        ->middleware('permission:manage flights');
        Route::post('flights', [AdminFlightController::class, 'store'])
        ->middleware('permission:manage flights');
        Route::put('flights/{id}', [AdminFlightController::class, 'update'])
        ->middleware('permission:manage flights');
        Route::delete('flights/{id}', [AdminFlightController::class, 'destroy'])
        ->middleware('permission:manage flights');

        // Revenue Analytics (Hana)
        Route::get('/analytics/revenue', [AdminAnalyticsController::class, 'revenue'])
            ->middleware('permission:view analytics')->name('analytics.revenue');

        // Analytics dashboard (Lojy)
        Route::get('/analytics', [AdminAnalyticsController::class, 'index'])
            ->middleware('permission:view analytics')->name('analytics.index');

        // Contact Inbox (Tyson)
        Route::get('/contacts', [ContactMessageController::class, 'index'])
            ->middleware('permission:manage contacts')->name('contacts.index');
        Route::patch('/contacts/{id}/read', [ContactMessageController::class, 'markAsRead'])
            ->middleware('permission:manage contacts')->name('contacts.read');
        Route::patch('/contacts/{id}/resolve', [ContactMessageController::class, 'markAsResolved'])
            ->middleware('permission:manage contacts')->name('contacts.resolve');

        // Settings (Tyson)
        Route::get('/settings', [SettingController::class, 'index'])
            ->middleware('permission:manage settings')->name('settings.index');
        Route::put('/settings', [SettingController::class, 'update'])
            ->middleware('permission:manage settings')->name('settings.update');
        Route::patch('/settings/{key}', [SettingController::class, 'patchKey'])
            ->middleware('permission:manage settings')->name('settings.patchKey');

        // Hotels (Rana)
        Route::get('hotels', [AdminHotelController::class, 'index'])->middleware('permission:manage hotels');
        Route::post('hotels', [AdminHotelController::class, 'store'])->middleware('permission:manage hotels');
        Route::put('hotels/{id}', [AdminHotelController::class, 'update'])->middleware('permission:manage hotels');
        Route::delete('hotels/{id}', [AdminHotelController::class, 'destroy'])->middleware('permission:manage hotels');

        // Attractions (Fady)
        Route::get('/attractions', [AdminAttractionController::class, 'index'])->middleware('permission:manage attractions');
        Route::post('/attractions', [AdminAttractionController::class, 'store'])->middleware('permission:manage attractions');
        Route::put('/attractions/{id}', [AdminAttractionController::class, 'update'])->middleware('permission:manage attractions');
        Route::delete('/attractions/{id}', [AdminAttractionController::class, 'destroy'])->middleware('permission:manage attractions');

        // Restaurants (Kenzy)
        Route::get('restaurants', [AdminRestaurantController::class, 'index'])->middleware('permission:manage restaurants');
        Route::post('restaurants', [AdminRestaurantController::class, 'store'])->middleware('permission:manage restaurants');
        Route::put('restaurants/{id}', [AdminRestaurantController::class, 'update'])->middleware('permission:manage restaurants');
        Route::delete('restaurants/{id}', [AdminRestaurantController::class, 'destroy'])->middleware('permission:manage restaurants');

        // Countries (Sama)
        Route::get('/countries', [AdminCountryController::class, 'index'])->middleware('permission:manage countries');
        Route::post('/countries', [AdminCountryController::class, 'store'])->middleware('permission:manage countries');
        Route::put('/countries/{id}', [AdminCountryController::class, 'update'])->middleware('permission:manage countries');
        Route::delete('/countries/{id}', [AdminCountryController::class, 'destroy'])->middleware('permission:manage countries');
    });
});

// Owner Trip View
Route::get('/v1/trips/{trip}', [TripController::class, 'show'])->middleware(['auth:api']);

// Public Explorer Routes & Maps (Kenzy & Hana)
Route::prefix('v1')->group(function () {
    // Maps
    Route::get('/maps/destination/{destination}', [MapController::class, 'destination']);
    Route::get('/maps/trip/{trip}', [MapController::class, 'trip'])->middleware('auth:api');

    // Destinations
    Route::get('destinations', [DestinationController::class, 'index']);
    Route::get('destinations/{id}', [DestinationController::class, 'show']);

    // Hotels
    Route::get('hotels', [HotelController::class, 'index']);
    Route::get('hotels/{id}', [HotelController::class, 'show']);

    // Flights
    Route::get('flights', [FlightController::class, 'index']);
    Route::get('flights/{id}', [FlightController::class, 'show']);

    // Restaurants
    Route::get('restaurants', [RestaurantController::class, 'index']);
    Route::get('restaurants/{id}', [RestaurantController::class, 'show']);

    // Attractions
    Route::get('attractions', [AttractionController::class, 'index']);
    Route::get('attractions/{id}', [AttractionController::class, 'show']);

    // Public site settings (cached, no auth)
    Route::get('/site-settings', [SiteSettingsController::class, 'index'])->name('site-settings.index');
});

// Weather
Route::get('/weather', [WeatherController::class, 'show']);

// Plans & Subscriptions (money layer — S5)
// Post /api/v1/admin/set-plans
// GET  /api/v1/plans                      # shared with F2
// POST /api/v1/me/subscribe                # plan_id, payment method
// POST /api/v1/me/upgrade                  # plan_id -> prorated charge
// POST /api/v1/me/subscription/cancel
// GET  /api/v1/me/subscription
Route::middleware(['auth:api'])->prefix('v1')->name('plans.')->group(function () {
    Route::post('admin/set-plans', [PlanController::class, 'setPlans'])
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




// AI (Fady)
Route::post('/review', [\App\Services\GroqService::class, 'generateAi'])
    ->middleware(['auth:api', 'permission:generate ai itineraries']);
Route::get('/review/{id}', [\App\Http\Controllers\AIController::class, 'review'])
    ->middleware('auth:api');

// Checkout & Payments (S5/Phase 4)
Route::middleware(['auth:api'])->prefix('v1/checkout')->name('checkout.')->group(function () {
    Route::post('/initiate', [\App\Http\Controllers\CheckoutController::class, 'initiate'])->name('initiate');
});

// Paymob Webhooks (Phase 5)
Route::prefix('v1/paymob')->name('paymob.')->group(function () {
    Route::post('/webhook', [\App\Http\Controllers\PaymobWebhookController::class, 'handle'])->name('webhook');
    Route::get('/callback', [\App\Http\Controllers\PaymobWebhookController::class, 'callback'])->name('callback');
});

// User Notifications (Phase 5)
Route::middleware(['auth:api'])->prefix('v1/notifications')->name('notifications.')->group(function () {
    Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::patch('/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    Route::patch('/{notification}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
});

// Admin Notifications (Phase 7)
Route::middleware(['auth:api', 'role:admin|super_admin'])->prefix('v1/admin/notifications')->name('admin.notifications.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Admin\AdminNotificationController::class, 'index']);
});

//Report
Route::middleware(['auth:api', 'role:admin|super_admin'])
    ->prefix('v1/admin')
    ->group(function () {
        Route::get('reports', [ReportController::class, 'index']);
        Route::post('reports/generate', [ReportController::class, 'generate']);
        Route::get('reports/{id}/download', [ReportController::class, 'download']);
    });
