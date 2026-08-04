<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SurveyController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');




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


// Category Routes
Route::prefix('v1')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
});

Route::middleware(['auth:api', 'role:admin'])->prefix('v1/admin')->group(function () {
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
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
    Route::middleware(['role:admin'])->prefix('v1/admin')->group(function () {
        // Contact Inbox
        Route::get('/contacts', [ContactMessageController::class, 'index']);
        Route::patch('/contacts/{id}/read', [ContactMessageController::class, 'markAsRead']);
        Route::patch('/contacts/{id}/resolve', [ContactMessageController::class, 'markAsResolved']);

        // Settings
        Route::get('/settings', [SettingController::class, 'index']);
        Route::put('/settings', [SettingController::class, 'update']);
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
Route::prefix('v1/admin')
    ->middleware(['auth:api', 'role:Admin'])
    ->group(function () {
        Route::get('hotels', [HotelController::class, 'index']);
        Route::post('hotels', [HotelController::class, 'store']);
        Route::put('hotels/{id}', [HotelController::class, 'update']);
        Route::delete('hotels/{id}', [HotelController::class, 'destroy']);
    });