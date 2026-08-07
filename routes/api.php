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
use App\Http\Controllers\InteractionController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\AdminAttractionController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\ContactController;
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
use App\Services\GroqService;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware('signed')
    ->name('verification.verify');

// Email Verification
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware('signed')
    ->name('verification.verify');

// Public Maps
Route::get('/v1/map/destination/{destination}', [MapController::class, 'destination']);

Route::middleware(['auth:api'])->group(function () {

    // Auth & Profile
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    Route::get('/email/verify-notice', [AuthController::class, 'verificationNotice'])
        ->name('verification.notice');

    Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])
        ->middleware('throttle:6,1')
        ->name('verification.resend');

    // User Interactions
    Route::post('/v1/favourites/{type}/{id}', [InteractionController::class, 'toggleFavourite']);
    Route::post('/v1/reviews/{type}/{id}', [InteractionController::class, 'storeReview']);
    Route::delete('/v1/reviews/{id}', [InteractionController::class, 'destroyReview']);

    // Surveys
    Route::apiResource('surveys', SurveyController::class);

    // Trips
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

        // Contacts
        Route::get('/contacts', [ContactMessageController::class, 'index'])
            ->middleware('permission:manage contacts');
        Route::patch('/contacts/{id}/read', [ContactMessageController::class, 'markAsRead'])
            ->middleware('permission:manage contacts');
        Route::patch('/contacts/{id}/resolve', [ContactMessageController::class, 'markAsResolved'])
            ->middleware('permission:manage contacts');

        // Settings
        Route::get('/settings', [SettingController::class, 'index'])
            ->middleware('permission:manage settings');
        Route::put('/settings', [SettingController::class, 'update'])
            ->middleware('permission:manage settings');

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
            ->middleware('permission:manage destinations');
        Route::put('/destinations/{id}', [AdminDestinationController::class, 'update'])
            ->middleware('permission:manage destinations');
        Route::delete('/destinations/{id}', [AdminDestinationController::class, 'destroy'])
            ->middleware('permission:manage destinations');

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

    // AI

    Route::post('/review',[GroqService::class,'generateAi'])
    ->middleware('permission:generate ai itineraries');

    Route::get('/review/{id}',[AIController::class,'review'])
    ->middleware('auth:api');


}); // نهاية auth group