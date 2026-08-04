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
use App\Http\Controllers\WeatherController;


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
Route::post('/login', [AuthController::class, 'login']);
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
    });
});



//Owner trip
Route::get('/v1/trips/{trip}', [TripController::class, 'show'])
    ->middleware(['auth:api']);

// Public Explorer Routes
Route::prefix('v1')->group(function () {
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