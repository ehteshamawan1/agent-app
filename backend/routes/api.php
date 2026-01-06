<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ZoneController;
use App\Http\Controllers\Api\PoleController;
use App\Http\Controllers\Api\LandOwnerController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LineOfSightController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Public settings endpoint for Google Maps API key (needed for map display)
Route::get('/settings/google_maps_api_key', function() {
    return app(SettingController::class)->show('google_maps_api_key');
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth endpoints
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Super Admin routes
    Route::middleware('role:super_admin')->prefix('super-admin')->group(function () {
        Route::apiResource('zones', ZoneController::class);
        Route::apiResource('users', UserController::class);
        Route::patch('zones/{id}/status', [ZoneController::class, 'toggleStatus']);
        Route::get('zones/{zoneId}/users', [ZoneController::class, 'users']);
        Route::patch('users/{id}/status', [UserController::class, 'toggleStatus']);
        Route::get('admins', [UserController::class, 'admins']);
        Route::get('agents', [UserController::class, 'agents']);
    });

    // Backward compatibility - Super Admin routes without prefix (for mobile app)
    Route::middleware('role:super_admin')->group(function () {
        Route::apiResource('zones', ZoneController::class)->names([
            'index' => 'zones.list',
            'store' => 'zones.create',
            'show' => 'zones.get',
            'update' => 'zones.edit',
            'destroy' => 'zones.remove'
        ]);
        Route::apiResource('users', UserController::class)->names([
            'index' => 'users.list',
            'store' => 'users.create',
            'show' => 'users.get',
            'update' => 'users.edit',
            'destroy' => 'users.remove'
        ]);
    });

    // Settings (Admin and Super Admin)
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::get('/settings', [SettingController::class, 'index']);
        Route::get('/settings/{key}', [SettingController::class, 'show']);
        Route::put('/settings/{key}', [SettingController::class, 'update']);
    });

    // Poles & Land Owners (Admin and Super Admin) - with /admin prefix
    Route::middleware('role:super_admin,admin')->prefix('admin')->group(function () {
        Route::apiResource('poles', PoleController::class);
        Route::patch('poles/{id}/status', [PoleController::class, 'toggleStatus']);
        Route::get('zones/{zoneId}/poles', [PoleController::class, 'getByZone']);
        Route::apiResource('land-owners', LandOwnerController::class);
    });

    // Backward compatibility - Poles & Land Owners without prefix (for mobile app)
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::apiResource('poles', PoleController::class)->names([
            'index' => 'poles.list',
            'store' => 'poles.create',
            'show' => 'poles.get',
            'update' => 'poles.edit',
            'destroy' => 'poles.remove'
        ]);
        Route::apiResource('land-owners', LandOwnerController::class)->names([
            'index' => 'land-owners.list',
            'store' => 'land-owners.create',
            'show' => 'land-owners.get',
            'update' => 'land-owners.edit',
            'destroy' => 'land-owners.remove'
        ]);
    });

    // Line of Sight Calculator (Admin and Super Admin with zone filtering)
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::post('/line-of-sight/calculate', [LineOfSightController::class, 'calculate']);
        Route::get('/line-of-sight/history/{poleId}', [LineOfSightController::class, 'history']);
        Route::get('/line-of-sight', [LineOfSightController::class, 'index']);
    });

    // Agent location check (Agent role)
    Route::middleware('role:agent')->group(function () {
        Route::post('/check-location', [PoleController::class, 'checkLocation']);
    });

    // Agent prefixed routes
    Route::middleware('role:agent')->prefix('agent')->group(function () {
        Route::get('/poles', [PoleController::class, 'agentPoles']);
        Route::get('/zone', [ZoneController::class, 'agentZone']);
    });

    // Map data
    Route::get('/map/poles', [PoleController::class, 'mapPoles']);
    Route::middleware('role:super_admin')->get('/map/zones', [ZoneController::class, 'mapZones']);
});
