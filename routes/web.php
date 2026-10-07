<?php

use App\Http\Controllers\WallController;
use Illuminate\Support\Facades\Route;

Route::get('/', [WallController::class, 'show'])->name('home');
Route::post('/shoutouts', [WallController::class, 'store'])->middleware('throttle:10,1')->name('shoutouts.store');
