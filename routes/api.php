<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;


// Category Routes
Route::apiResource('categories', CategoryController::class);