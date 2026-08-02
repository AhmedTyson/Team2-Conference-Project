<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;


// Category Routes
Route::apiResource('categories', CategoryController::class);

// Public routes 
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgetPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// verification email 
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed'])
    ->name('verification.verify');

// routes (must be logged in)
Route::middleware(['auth:api'])->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/email/verify-notice', [AuthController::class, 'verificationNotice'])
        ->name('verification.notice');
    Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])
        ->middleware(['throttle:6,1'])
        ->name('verification.resend');
    Route::post('/refresh', [AuthController::class, 'refresh']);
});