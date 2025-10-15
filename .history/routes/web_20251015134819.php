<?php

use Illuminate\Support\Facades\Route;

// ...existing routes

// Public landing page route
Route::get('/landing', [App\Http\Controllers\LandingController::class, 'index'])->name('landing');
Route::post('/landing/submit', [App\Http\Controllers\LandingController::class, 'submitLead'])->name('landing.submit');

// ...existing routes