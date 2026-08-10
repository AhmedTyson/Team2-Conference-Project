<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\AttractionController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\AdminAttractionController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\InteractionController;
use App\Http\Controllers\SurveyController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\AIController;
// Admin Controllers
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminReviewController;
use App\Http\Controllers\Admin\AdminTripController;
use App\Http\Controllers\Admin\ContactMessageController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\AdminHotelController;
use App\Http\Controllers\Admin\DestinationController as AdminDestinationController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\SiteSettingsController;
use App\Services\GroqService;

Route::post('/login', [AuthController::class, 'login']);
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

    //Maps
    Route::get('/v1/map/trip/{trip}', [MapController::class, 'trip']);

    // Categories
    Route::get('/v1/categories', [CategoryController::class, 'index']);
    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('v1/admin')->name('admin.')->group(function () {
        // Users Management (Sarah)
        Route::get('/users', [AdminUserController::class, 'index'])->middleware('permission:manage users');
        Route::post('/users', [AdminUserController::class, 'store'])->middleware('permission:manage users');
        Route::put('/users/{user}', [AdminUserController::class, 'update'])->middleware('permission:manage users');
        Route::patch('/users/{user}/active', [AdminUserController::class, 'active'])->middleware('permission:manage users');
        Route::patch('/users/{user}/block', [AdminUserController::class, 'block'])->middleware('permission:manage users');

        // Contacts
        Route::get('/contacts', [ContactMessageController::class, 'index'])
            ->middleware('permission:manage contacts');
        Route::patch('/contacts/{id}/read', [ContactMessageController::class, 'markAsRead'])
            ->middleware('permission:manage contacts');
        Route::patch('/contacts/{id}/resolve', [ContactMessageController::class, 'markAsResolved'])
            ->middleware('permission:manage contacts');

        // Trips Management (Hana)
        Route::get('/trips', [AdminTripController::class, 'index'])->middleware('permission:manage trips');
        Route::put('/trips/{id}', [AdminTripController::class, 'update'])->middleware('permission:manage trips');
        Route::delete('/trips/{id}', [AdminTripController::class, 'destroy'])->middleware('permission:manage trips');

        // Attractions
        Route::get('/attractions', [AdminAttractionController::class, 'index']);
        Route::post('/attractions', [AdminAttractionController::class, 'store']);
        Route::put('/attractions/{id}', [AdminAttractionController::class, 'update']);
        Route::delete('/attractions/{id}', [AdminAttractionController::class, 'destroy']);

        // Users
        Route::get('/users', [AdminUserController::class, 'index'])
            ->middleware('permission:manage users');
        Route::post('/users', [AdminUserController::class, 'store'])
            ->middleware('permission:manage users');

        // Reviews
        Route::get('/reviews', [AdminReviewController::class, 'index'])
            ->middleware('permission:manage reviews');
        Route::patch('/reviews/{id}/approve', [AdminReviewController::class, 'approve'])
            ->middleware('permission:manage reviews');
        Route::patch('/reviews/{id}/reject', [AdminReviewController::class, 'reject'])
            ->middleware('permission:manage reviews');
        Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy'])
            ->middleware('permission:manage reviews');

        // Trips
        Route::get('/trips', [AdminTripController::class, 'index'])
            ->middleware('permission:manage trips');
        Route::put('/trips/{id}', [AdminTripController::class, 'update'])
            ->middleware('permission:manage trips');
        Route::delete('/trips/{id}', [AdminTripController::class, 'destroy'])
            ->middleware('permission:manage trips');

        // Destinations
        Route::get('/destinations', [DestinationController::class, 'index'])
            ->middleware('permission:manage destinations');
        Route::post('/destinations', [AdminDestinationController::class, 'store'])
            ->middleware('permission:manage destinations')->name('destinations.store');
        Route::put('/destinations/{id}', [AdminDestinationController::class, 'update'])
            ->middleware('permission:manage destinations')->name('destinations.update');
        Route::delete('/destinations/{id}', [AdminDestinationController::class, 'destroy'])
            ->middleware('permission:manage destinations')->name('destinations.destroy');

        // Hotels
        Route::get('/hotels', [AdminHotelController::class, 'index'])
            ->middleware('permission:manage hotels');
        Route::post('/hotels', [AdminHotelController::class, 'store'])
            ->middleware('permission:manage hotels');
        Route::put('/hotels/{id}', [AdminHotelController::class, 'update'])
            ->middleware('permission:manage hotels');
        Route::delete('/hotels/{id}', [AdminHotelController::class, 'destroy'])
            ->middleware('permission:manage hotels');
    });
});

    // AI

    Route::post('/review',[GroqService::class,'generateAi'])
    ->middleware('permission:generate ai itineraries');
// Owner Trip View
Route::get('/v1/trips/{trip}', [TripController::class, 'show'])->middleware(['auth:api']);

// Public Explorer Routes & Maps (Kenzy & Hana)
Route::prefix('v1')->group(function () {
    // Maps
    Route::get('/maps/destination/{destination}', [MapController::class, 'destination']);
    Route::get('/maps/trip/{trip}', [MapController::class, 'trip'])->middleware('auth:api');

    Route::get('/review/{id}',[AIController::class,'review'])
    ->middleware('auth:api');


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



