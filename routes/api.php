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
<<<<<<< HEAD
use App\Http\Controllers\TripController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\InteractionController;
use App\Http\Controllers\SurveyController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\MapController;

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
use App\Http\Controllers\AdminAttractionController;
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

    // User Interactions (Community)
    Route::post('/v1/favourites/{type}/{id}', [InteractionController::class, 'toggleFavourite']);
    Route::post('/v1/reviews/{type}/{id}', [InteractionController::class, 'storeReview']);
    Route::delete('/v1/reviews/{id}', [InteractionController::class, 'destroyReview']);

    // Surveys
    Route::apiResource('surveys', SurveyController::class);

    // Trip Planner
    Route::get('/v1/trips/create', [TripController::class, 'create']);
    Route::post('/v1/trips', [TripController::class, 'store']);

    // Admin Routes
    Route::prefix('v1/admin')->name('admin.')->group(function () {
        // Users Management (Sarah)
        Route::get('/users', [AdminUserController::class, 'index'])->middleware('permission:manage users');
        Route::post('/users', [AdminUserController::class, 'store'])->middleware('permission:manage users');

        // Reviews Moderation (Lojy)
        Route::get('/reviews', [AdminReviewController::class, 'index'])->middleware('permission:manage reviews');
        Route::patch('/reviews/{id}/approve', [AdminReviewController::class, 'approve'])->middleware('permission:manage reviews');
        Route::patch('/reviews/{id}/reject', [AdminReviewController::class, 'reject'])->middleware('permission:manage reviews');
        Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy'])->middleware('permission:manage reviews');

        // Trips Management (Hana)
        Route::get('/trips', [AdminTripController::class, 'index'])->middleware('permission:manage trips');
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

// Public Explorer Routes & Maps
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

    // Restaurants
    Route::get('restaurants', [RestaurantController::class, 'index']);
    Route::get('restaurants/{id}', [RestaurantController::class, 'show']);

    // Attractions
    Route::get('attractions', [AttractionController::class, 'index']);
    Route::get('attractions/{id}', [AttractionController::class, 'show']);
});

// Weather
Route::get('/weather', [WeatherController::class, 'show']);
