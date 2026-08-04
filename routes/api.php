<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SurveyController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\AttractionController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\InteractionController;
use App\Http\Controllers\Api\V1\Admin\ContactMessageController;
use App\Http\Controllers\Api\V1\Admin\SettingController;
use App\Http\Controllers\Api\V1\Admin\DestinationController as AdminDestinationController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\Api\V1\AdminReviewController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\AdminTripController;

// Category Routes
Route::prefix('v1')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/categories/{category}', [CategoryController::class, 'show'])->name('categories.show');
});

Route::middleware(['auth:api'])->prefix('v1/admin')->name('admin.')->group(function () {
    Route::post('/categories', [CategoryController::class, 'store'])
        ->middleware('permission:manage categories')->name('categories.store');
    Route::put('/categories/{category}', [CategoryController::class, 'update'])
        ->middleware('permission:manage categories')->name('categories.update');
});

// Public routes 
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/forgot-password', [AuthController::class, 'forgetPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');
Route::post('/v1/contacts', [ContactController::class, 'store']);

// verification email 
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed'])
    ->name('verification.verify');

// routes (must be logged in)
Route::middleware(['auth:api'])->group(function () {
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

    Route::apiResource('surveys', SurveyController::class);

    //Trip 
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

        // Destinations
        Route::get('/destinations', [AdminDestinationController::class, 'index'])
            ->middleware('permission:manage destinations')->name('destinations.index');
        Route::post('/destinations', [AdminDestinationController::class, 'store'])
            ->middleware('permission:manage destinations')->name('destinations.store');
        Route::put('/destinations/{id}', [AdminDestinationController::class, 'update'])
            ->middleware('permission:manage destinations')->name('destinations.update');
        Route::delete('/destinations/{id}', [AdminDestinationController::class, 'destroy'])
            ->middleware('permission:manage destinations')->name('destinations.destroy');

        // Contact Inbox
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
            
        // Hotels
        Route::get('hotels', [HotelController::class, 'index'])->middleware('permission:manage hotels');
        Route::post('hotels', [HotelController::class, 'store'])->middleware('permission:manage hotels');
        Route::put('hotels/{id}', [HotelController::class, 'update'])->middleware('permission:manage hotels');
        Route::delete('hotels/{id}', [HotelController::class, 'destroy'])->middleware('permission:manage hotels');
    });
});

//Owner trip
Route::get('/v1/trips/{trip}', [TripController::class, 'show'])
    ->middleware(['auth:api']);

// Public Explorer Routes
Route::prefix('v1')->group(function () {
    // Maps
    Route::get('/maps/destination/{destination}', [MapController::class, 'destination']);
    Route::get('/maps/trip/{trip}', [MapController::class, 'trip'])->middleware('auth:api');

    Route::get('destinations', [DestinationController::class, 'index']);
    Route::get('destinations/{id}', [DestinationController::class, 'show']);

    Route::get('hotels', [HotelController::class, 'index']);
    Route::get('hotels/{id}', [HotelController::class, 'show']);

    Route::get('restaurants', [RestaurantController::class, 'index']);
    Route::get('restaurants/{id}', [RestaurantController::class, 'show']);

    Route::get('attractions', [AttractionController::class, 'index']);
    Route::get('attractions/{id}', [AttractionController::class, 'show']);
});

// weather
Route::get('/weather', [WeatherController::class, 'show']);
