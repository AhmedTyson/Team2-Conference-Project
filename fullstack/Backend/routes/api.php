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
use App\Http\Controllers\Catalog\CountryController;
use App\Http\Controllers\Catalog\DestinationController;
use App\Http\Controllers\Catalog\FlightController;
use App\Http\Controllers\Catalog\HotelController;
use App\Http\Controllers\Catalog\RegionController;
use App\Http\Controllers\Catalog\RestaurantController;
use App\Http\Controllers\Catalog\StatsController;
use App\Http\Controllers\Commerce\AdminAgencyController;
// Commerce
use App\Http\Controllers\Commerce\AdminAnalyticsController;
use App\Http\Controllers\Commerce\AgencyAssignmentController;
use App\Http\Controllers\Commerce\AgencyRequestController;
use App\Http\Controllers\Commerce\CheckoutController;
use App\Http\Controllers\Commerce\PaymobWebhookController;
use App\Http\Controllers\Commerce\PlanController;
use App\Http\Controllers\ConciergeController;
// System
use App\Http\Controllers\System\AdminFlagController;
use App\Http\Controllers\System\AdminNotificationController;
use App\Http\Controllers\System\ContactController;
use App\Http\Controllers\System\ContactMessageController;
use App\Http\Controllers\System\DashboardController;
use App\Http\Controllers\System\FlagController;
use App\Http\Controllers\System\NotificationController;
use App\Http\Controllers\System\ReportController;
use App\Http\Controllers\System\SettingController;
use App\Http\Controllers\System\SiteSettingsController;
use App\Http\Controllers\System\SurveyController;
// Trips
use App\Http\Controllers\System\WeatherController;
use App\Http\Controllers\Trips\AdminReviewController;
use App\Http\Controllers\Trips\AdminTripController;
use App\Http\Controllers\Trips\AIController;
use App\Http\Controllers\Trips\InteractionController;
use App\Http\Controllers\Trips\MapController;
use App\Http\Controllers\Trips\TripController;
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

// ---- Authenticated session & profile (excluded from 'verified': unverified
// users must reach me/logout/refresh/verify-notice/resend/updateProfile)
Route::middleware(['auth:api'])->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware(['throttle:15,1']);
    Route::get('/email/verify-notice', [AuthController::class, 'verificationNotice'])
        ->name('verification.notice');
    Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])
        ->middleware(['throttle:6,1'])
        ->name('verification.resend');
    Route::match(['patch', 'post'], '/profile', [AuthController::class, 'updateProfile']);
});

Route::middleware(['auth:api', 'verified'])->group(function () {
    Route::apiResource('trips', TripController::class);
});

// ---- Admin: users
Route::middleware(['auth:api', 'verified'])->prefix('admin')->name('admin.')->group(function () {
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
Route::group([], function () {
    // Categories
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/categories/{category}', [CategoryController::class, 'show'])->name('categories.show');

    // Countries & Cities
    Route::get('/countries', [CountryController::class, 'index']);
    Route::get('/countries/{id}', [CountryController::class, 'show']);
    Route::get('/cities', [CountryController::class, 'cities']);

    // Destinations
    Route::get('/destinations', [DestinationController::class, 'index']);
    Route::get('/destinations/{id}', [DestinationController::class, 'show']);
    Route::get('/destinations/{destination}/hotels', [HotelController::class, 'byDestination']);

    // Hotels
    Route::get('/hotels', [HotelController::class, 'index']);
    Route::get('/hotels/{id}', [HotelController::class, 'show']);
    Route::get('/hotels/{hotel}/reviews', [HotelController::class, 'reviews']);

    // Regions
    Route::get('/regions', [RegionController::class, 'index']);

    // Stats
    Route::get('/stats/summary', [StatsController::class, 'summary']);

    // Flights
    Route::get('/flights', [FlightController::class, 'index']);
    Route::get('/flights/{id}', [FlightController::class, 'show']);

    // Restaurants
    Route::get('/restaurants', [RestaurantController::class, 'index']);
    Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);

    // Attractions
    Route::get('/attractions', [AttractionController::class, 'index']);
    Route::get('/attractions/{id}', [AttractionController::class, 'show']);

    // Public Reviews
    Route::get('/reviews/{type}/{id}', [InteractionController::class, 'getEntityReviews']);

    // Public site settings (cached, no auth)
    Route::get('/site-settings', [SiteSettingsController::class, 'index'])->name('site-settings.index');
});

// ---- Itinera Tour Booking (authenticated)
Route::middleware(['auth:api'])->group(function () {
    Route::post('/destinations/{destination}/book', [DestinationController::class, 'book']);
});

// ---- V1 Compatibility Aliases
Route::prefix('v1')->group(function () {
    Route::get('/countries', [CountryController::class, 'index']);
    Route::get('/countries/{id}', [CountryController::class, 'show']);
    Route::get('/cities', [CountryController::class, 'cities']);
    Route::get('/destinations', [DestinationController::class, 'index']);
    Route::get('/destinations/{id}', [DestinationController::class, 'show']);
    Route::get('/destinations/{destination}/hotels', [HotelController::class, 'byDestination']);
    Route::get('/hotels', [HotelController::class, 'index']);
    Route::get('/hotels/{id}', [HotelController::class, 'show']);
    Route::get('/hotels/{hotel}/reviews', [HotelController::class, 'reviews']);
    Route::get('/restaurants', [RestaurantController::class, 'index']);
    Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);
    Route::get('/attractions', [AttractionController::class, 'index']);
    Route::get('/attractions/{id}', [AttractionController::class, 'show']);
    Route::get('/flights', [FlightController::class, 'index']);
    Route::get('/flights/{id}', [FlightController::class, 'show']);
    Route::get('/regions', [RegionController::class, 'index']);
    Route::get('/stats/summary', [StatsController::class, 'summary']);
    Route::get('/weather', [WeatherController::class, 'show'])->middleware('throttle:weather');
    Route::middleware(['auth:api'])->post('/destinations/{destination}/book', [DestinationController::class, 'book']);
    Route::middleware(['auth:api', 'verified'])->group(function () {
        Route::get('/trips', [TripController::class, 'index']);
        Route::get('/trips/{trip}', [TripController::class, 'show']);
        Route::post('/trips', [TripController::class, 'store']);
        Route::put('/trips/{trip}', [TripController::class, 'update']);
        Route::delete('/trips/{trip}', [TripController::class, 'destroy']);
        Route::get('/review/{id}', [AIController::class, 'review']);
        Route::get('/ai/review/{id}', [AIController::class, 'review']);
        Route::post('/review/{id}', [AIController::class, 'review']);
        Route::post('/ai/review/{id}', [AIController::class, 'review']);
    });
});

// ---- Admin CRUD
Route::middleware(['auth:api', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Categories
    Route::get('/categories', [AdminCategoryController::class, 'index'])
        ->middleware('permission:manage categories')->name('categories.index');
    Route::post('/categories', [AdminCategoryController::class, 'store'])
        ->middleware('permission:manage categories')->name('categories.store');
    Route::put('/categories/{category}', [AdminCategoryController::class, 'update'])
        ->middleware('permission:manage categories')->name('categories.update');
    Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])
        ->middleware('permission:manage categories')->name('categories.destroy');
    Route::patch('/categories/{id}/restore', [AdminCategoryController::class, 'restore'])
        ->middleware('permission:manage categories')->name('categories.restore');

    // Countries
    Route::get('/countries', [AdminCountryController::class, 'index'])->middleware('permission:manage countries');
    Route::post('/countries', [AdminCountryController::class, 'store'])->middleware('permission:manage countries');
    Route::put('/countries/{id}', [AdminCountryController::class, 'update'])->middleware('permission:manage countries');
    Route::delete('/countries/{id}', [AdminCountryController::class, 'destroy'])->middleware('permission:manage countries');
    Route::patch('/countries/{id}/restore', [AdminCountryController::class, 'restore'])->middleware('permission:manage countries');

    // Destinations
    Route::get('/destinations', [AdminDestinationController::class, 'index'])
        ->middleware('permission:manage destinations')->name('destinations.index');
    Route::post('/destinations', [AdminDestinationController::class, 'store'])
        ->middleware('permission:manage destinations')->name('destinations.store');
    Route::put('/destinations/{id}', [AdminDestinationController::class, 'update'])
        ->middleware('permission:manage destinations')->name('destinations.update');
    Route::delete('/destinations/{id}', [AdminDestinationController::class, 'destroy'])
        ->middleware('permission:manage destinations')->name('destinations.destroy');
    Route::patch('/destinations/{id}/restore', [AdminDestinationController::class, 'restore'])
        ->middleware('permission:manage destinations')->name('destinations.restore');

    // Flights
    Route::get('/flights', [AdminFlightController::class, 'index'])
        ->middleware('permission:manage flights');
    Route::post('/flights', [AdminFlightController::class, 'store'])
        ->middleware('permission:manage flights');
    Route::put('/flights/{id}', [AdminFlightController::class, 'update'])
        ->middleware('permission:manage flights');
    Route::delete('/flights/{id}', [AdminFlightController::class, 'destroy'])
        ->middleware('permission:manage flights');
    Route::patch('/flights/{id}/restore', [AdminFlightController::class, 'restore'])
        ->middleware('permission:manage flights');

    // Hotels
    Route::get('/hotels', [AdminHotelController::class, 'index'])->middleware('permission:manage hotels');
    Route::post('/hotels', [AdminHotelController::class, 'store'])->middleware('permission:manage hotels');
    Route::put('/hotels/{id}', [AdminHotelController::class, 'update'])->middleware('permission:manage hotels');
    Route::delete('/hotels/{id}', [AdminHotelController::class, 'destroy'])->middleware('permission:manage hotels');
    Route::patch('/hotels/{id}/restore', [AdminHotelController::class, 'restore'])->middleware('permission:manage hotels');

    // Attractions
    Route::get('/attractions', [AdminAttractionController::class, 'index'])->middleware('permission:manage attractions');
    Route::post('/attractions', [AdminAttractionController::class, 'store'])->middleware('permission:manage attractions');
    Route::put('/attractions/{id}', [AdminAttractionController::class, 'update'])->middleware('permission:manage attractions');
    Route::delete('/attractions/{id}', [AdminAttractionController::class, 'destroy'])->middleware('permission:manage attractions');
    Route::patch('/attractions/{id}/restore', [AdminAttractionController::class, 'restore'])->middleware('permission:manage attractions');

    // Restaurants
    Route::get('/restaurants', [AdminRestaurantController::class, 'index'])->middleware('permission:manage restaurants');
    Route::post('/restaurants', [AdminRestaurantController::class, 'store'])->middleware('permission:manage restaurants');
    Route::put('/restaurants/{id}', [AdminRestaurantController::class, 'update'])->middleware('permission:manage restaurants');
    Route::delete('/restaurants/{id}', [AdminRestaurantController::class, 'destroy'])->middleware('permission:manage restaurants');
    Route::patch('/restaurants/{id}/restore', [AdminRestaurantController::class, 'restore'])->middleware('permission:manage restaurants');
});

// ============================================================
// TRIPS
// ============================================================

// ---- Maps
Route::group([], function () {
    Route::get('/maps/destination/{destination}', [MapController::class, 'destination'])->middleware('throttle:maps');
    Route::get('/maps/trip/{trip}', [MapController::class, 'trip'])->middleware(['auth:api', 'verified']);
});

// ---- Trip planner (authenticated)
Route::middleware(['auth:api', 'verified'])->prefix('trips')->group(function () {
    Route::get('/create', [TripController::class, 'creationData']);
    Route::post('/', [TripController::class, 'store']);
    Route::post('/{trip}/attach/{type}', [TripController::class, 'attach']);
    Route::put('/{trip}/items/{id}', [TripController::class, 'updateItem']);
    Route::delete('/{trip}/detach/{id}', [TripController::class, 'detach']);

    // Fork a trip for authenticated user
    Route::post('/{trip}/fork', [TripController::class, 'fork']);
});

// Owner trip view (registered after literal /create so the literal wins)
Route::get('/trips/{trip}', [TripController::class, 'show'])->middleware(['auth:api', 'verified']);

// ---- Concierge (AI trip assistant chat)
Route::middleware(['auth:api', 'verified', 'throttle:ai'])->group(function () {
    Route::post('/trips/{trip}/concierge', [ConciergeController::class, 'ask']);
});

// ---- Real-Time Messaging & Conversations (Travelers, Agencies, AI Concierge)
Route::middleware(['auth:api', 'verified'])->group(function () {
    Route::get('/conversations', [\App\Http\Controllers\Chat\ConversationController::class, 'index']);
    Route::post('/conversations', [\App\Http\Controllers\Chat\ConversationController::class, 'store']);
    Route::get('/conversations/{conversation}', [\App\Http\Controllers\Chat\ConversationController::class, 'show']);
    Route::get('/conversations/{conversation}/messages', [\App\Http\Controllers\Chat\ConversationController::class, 'messages']);
    Route::post('/conversations/{conversation}/messages', [\App\Http\Controllers\Chat\ConversationController::class, 'sendMessage']);
    Route::patch('/conversations/{conversation}/read', [\App\Http\Controllers\Chat\ConversationController::class, 'markAsRead']);
});

// ---- Interaction & reviews
Route::middleware(['auth:api', 'verified'])->group(function () {
    Route::get('/me/reviews', [InteractionController::class, 'myReviews']);
    Route::get('/reviews/my', [InteractionController::class, 'myReviews']);
    Route::post('/favourites/{type}/{id}', [InteractionController::class, 'toggleFavourite']);
    Route::post('/reviews/{type}/{id}', [InteractionController::class, 'storeReview']);
    Route::delete('/reviews/{id}', [InteractionController::class, 'destroyReview']);
});

// ---- AI trip assistant
Route::post('/enhance', [AIController::class, 'enhance'])->middleware(['auth:api', 'verified', 'throttle:ai']);
Route::post('/review', [AIController::class, 'generate'])
    ->middleware(['auth:api', 'verified', 'permission:generate ai itineraries', 'throttle:ai']);
Route::post('/trips/generate-ai', [AIController::class, 'generate'])
    ->middleware(['throttle:ai']);
Route::post('/trips/ai-generate', [AIController::class, 'generate'])
    ->middleware(['throttle:ai']);
Route::post('/ai/plan', [AIController::class, 'generate'])
    ->middleware(['throttle:ai']);
Route::get('/review/{id}', [AIController::class, 'review'])
    ->middleware(['auth:api', 'verified', 'throttle:ai']);
Route::get('/ai/review/{id}', [AIController::class, 'review'])
    ->middleware(['auth:api', 'verified', 'throttle:ai']);
Route::post('/review/{id}', [AIController::class, 'review'])
    ->middleware(['auth:api', 'verified', 'throttle:ai']);
Route::post('/ai/review/{id}', [AIController::class, 'review'])
    ->middleware(['auth:api', 'verified', 'throttle:ai']);

// ---- Admin: trips & reviews moderation
Route::middleware(['auth:api', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Trips
    Route::get('/trips', [AdminTripController::class, 'index'])->middleware('permission:manage trips');
    Route::post('/trips', [AdminTripController::class, 'store'])->middleware('permission:manage trips');
    Route::put('/trips/{id}', [AdminTripController::class, 'update'])->middleware('permission:manage trips');
    Route::delete('/trips/{id}', [AdminTripController::class, 'destroy'])->middleware('permission:manage trips');
    Route::patch('/trips/{id}/restore', [AdminTripController::class, 'restore'])->middleware('permission:manage trips');

    // Reviews
    Route::get('/reviews', [AdminReviewController::class, 'index'])->middleware('permission:manage reviews');
    Route::patch('/reviews/{id}/approve', [AdminReviewController::class, 'approve'])->middleware('permission:manage reviews');
    Route::patch('/reviews/{id}/reject', [AdminReviewController::class, 'reject'])->middleware('permission:manage reviews');
    Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy'])->middleware('permission:manage reviews');
    Route::patch('/reviews/{id}/restore', [AdminReviewController::class, 'restore'])->middleware('permission:manage reviews');
    // Flags
    Route::get('/flags', [AdminFlagController::class, 'index'])->middleware('role:admin|super_admin');
    Route::post('/flags/{id}/approve', [AdminFlagController::class, 'approve'])->middleware('role:admin|super_admin');
    Route::post('/flags/{id}/decline', [AdminFlagController::class, 'decline'])->middleware('role:admin|super_admin');
});

// ============================================================
// COMMERCE
// ============================================================

// ---- Public Plans
Route::get('/plans', [PlanController::class, 'index']);
Route::get('/plans/{id}', [PlanController::class, 'show']);

// ---- Authenticated Plans & subscriptions
Route::middleware(['auth:api', 'verified'])->name('plans.')->group(function () {
    Route::post('/admin/set-plans', [PlanController::class, 'setPlans'])
        ->middleware('permission:manage plans');

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
Route::middleware(['auth:api', 'verified'])->prefix('checkout')->name('checkout.')->group(function () {
    Route::post('/initiate', [CheckoutController::class, 'initiate'])
        ->middleware('throttle:checkout')->name('initiate');
});

// ---- Paymob webhooks (no auth — provider signature verified in controller)
Route::prefix('paymob')->name('paymob-v1.')->group(function () {
    Route::post('/webhook', [PaymobWebhookController::class, 'handle'])->name('webhook');
    Route::get('/callback', [PaymobWebhookController::class, 'callback'])->name('callback');
});

// Fallback named routes without 'api.' prefix to prevent Route [paymob-v1.callback] not defined exception
Route::post('/paymob/webhook', [PaymobWebhookController::class, 'handle'])->name('paymob-v1.webhook');
Route::get('/paymob/callback', [PaymobWebhookController::class, 'callback'])->name('paymob-v1.callback');

Route::prefix('v1/paymob')->group(function () {
    Route::post('/webhook', [PaymobWebhookController::class, 'handle']);
    Route::get('/callback', [PaymobWebhookController::class, 'callback']);
});

// ---- Admin: revenue analytics
Route::middleware(['auth:api', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/analytics/revenue', [AdminAnalyticsController::class, 'revenue'])
        ->middleware('permission:view analytics')->name('analytics.revenue');
    Route::get('/analytics', [AdminAnalyticsController::class, 'index'])
        ->middleware('permission:view analytics')->name('analytics.index');
});

// ============================================================
// SYSTEM
// ============================================================

// ---- Public contacts & weather
Route::post('/contacts', [ContactController::class, 'store'])->middleware('throttle:contacts');
Route::get('/weather', [WeatherController::class, 'show'])->middleware('throttle:weather');

// ---- Surveys (authenticated)
Route::middleware(['auth:api', 'verified'])->group(function () {
    Route::apiResource('surveys', SurveyController::class);
});

// ---- Dashboard
Route::middleware(['auth:api', 'verified'])->prefix('dashboard')->name('dashboard.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('index');
    Route::get('/trips', [DashboardController::class, 'trips'])->name('trips');
    Route::get('/favourites', [DashboardController::class, 'favourites'])->name('favourites');
    Route::get('/orders', [DashboardController::class, 'orders'])->name('orders');
});

Route::middleware(['auth:api', 'verified'])->group(function () {
    Route::get('/orders', [DashboardController::class, 'orders']);
    Route::get('/me/orders', [DashboardController::class, 'orders']);
    Route::get('/orders/lookup/{orderRef}', [DashboardController::class, 'lookupOrder']);
    Route::get('/me/ai-quota', [DashboardController::class, 'aiQuota']);
    Route::get('/ai/quota', [DashboardController::class, 'aiQuota']);
});

// ---- Notifications
Route::middleware(['auth:api', 'verified'])->prefix('notifications')->name('notifications.')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::patch('/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead']);
});

// ---- My reports
Route::middleware(['auth:api', 'verified'])->group(function () {
    Route::get('/me/reports', [ReportController::class, 'myReports']);
});

// ---- Admin
Route::middleware(['auth:api', 'verified', 'role:admin|super_admin'])->prefix('admin/notifications')->name('admin.notifications.')->group(function () {
    Route::get('/', [AdminNotificationController::class, 'index']);
});

Route::middleware(['auth:api', 'verified'])->prefix('admin')->name('admin.')->group(function () {
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

// ---- Reports & Analytics Downloads
Route::middleware(['auth:api', 'verified', 'role:admin|super_admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/reports', [ReportController::class, 'index']);
        Route::post('/reports/generate', [ReportController::class, 'generate']);
        Route::get('/reports/{id}/download', [ReportController::class, 'download']);
    });

Route::middleware(['auth:api'])->group(function () {
    Route::post('/agency-requests', [AgencyRequestController::class, 'store']);
    Route::get('/admin/agency-requests', [AdminAgencyController::class, 'adminIndex'])
        ->middleware('role:admin|super_admin')
        ->name('agency-requests.index');
    Route::post('/admin/agency-requests/{assignment}/approve', [AdminAgencyController::class, 'approve'])->middleware('role:admin|super_admin');
    Route::post('/agency/assignments/{assignment}/approve', [AgencyAssignmentController::class, 'approve'])->middleware('role:agency|admin|super_admin');
    Route::post('/agency/assignments/{assignment}/decline', [AgencyAssignmentController::class, 'decline'])->middleware('role:agency|admin|super_admin');
    Route::post('/agency/assignments/{assignment}/trips', [AgencyAssignmentController::class, 'createTrip'])->middleware('role:agency|admin|super_admin');
    Route::get('/agency/assignments', [AgencyAssignmentController::class, 'index'])->middleware('role:agency|admin|super_admin');
    Route::get('/agency/trips', [AgencyAssignmentController::class, 'trips'])->middleware('role:agency|admin|super_admin');
    Route::get('/agency/earnings', [AgencyAssignmentController::class, 'earnings'])->middleware('role:agency|admin|super_admin');
    Route::get('/agency/profile', [AgencyAssignmentController::class, 'getProfile'])->middleware('role:agency|admin|super_admin');
    Route::put('/agency/profile', [AgencyAssignmentController::class, 'updateProfile'])->middleware('role:agency|admin|super_admin');
    Route::get('/agency-assignments', [AgencyAssignmentController::class, 'myAssignments']);
    Route::post('/agency-assignments/{assignment}/cancel', [AgencyAssignmentController::class, 'cancel']);

    // Plans
    Route::post('/agency-assignments/{assignment}/report', [FlagController::class, 'store'])->middleware(['auth:api']);
});
