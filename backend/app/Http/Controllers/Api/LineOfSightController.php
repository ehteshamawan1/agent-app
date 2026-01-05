<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LineOfSightCalculation;
use App\Models\Pole;
use App\Models\Setting;
use App\Services\GeoLocationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class LineOfSightController extends Controller
{
    /**
     * Calculate Line of Sight between pole and agent location
     */
    public function calculate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pole_id' => 'required|exists:poles,id',
            'agent_latitude' => 'required|numeric|between:-90,90',
            'agent_longitude' => 'required|numeric|between:-180,180',
            'calculation_notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $pole = Pole::findOrFail($request->pole_id);
            $user = $request->user();

            // Zone access check for regular admins
            if ($user->role === 'admin' && $pole->zone_id !== $user->zone_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only calculate LoS for poles in your assigned zone'
                ], 403);
            }

            // Get Google Maps API key from settings
            $apiKey = Setting::where('key', 'google_maps_api_key')->value('value');

            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'Google Maps API key not configured. Please configure it in Settings.'
                ], 500);
            }

            // Get elevations from Google Elevation API
            $poleElevation = $this->getElevation($pole->latitude, $pole->longitude, $apiKey);
            $agentElevation = $this->getElevation($request->agent_latitude, $request->agent_longitude, $apiKey);

            if ($poleElevation === null || $agentElevation === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch elevation data from Google API. Please check your API key and ensure Elevation API is enabled.'
                ], 500);
            }

            // Calculate distance between pole and agent
            $distance = GeoLocationService::haversineDistance(
                $pole->latitude,
                $pole->longitude,
                $request->agent_latitude,
                $request->agent_longitude
            );

            // Calculate Line of Sight
            $poleTopHeight = $poleElevation + $pole->pole_height;
            $elevationDifference = $poleTopHeight - $agentElevation;

            // Determine result
            $result = 'CLEAR';
            $extraHeightRequired = null;

            if ($elevationDifference < 0) {
                $result = 'BLOCKED';
            } elseif ($elevationDifference < $pole->pole_height) {
                $result = 'PARTIAL';
                $extraHeightRequired = $pole->pole_height - $elevationDifference;
            }

            // Store calculation in database
            $calculation = LineOfSightCalculation::create([
                'pole_id' => $pole->id,
                'agent_latitude' => $request->agent_latitude,
                'agent_longitude' => $request->agent_longitude,
                'agent_elevation' => $agentElevation,
                'pole_elevation' => $poleElevation,
                'elevation_difference' => $elevationDifference,
                'distance_from_pole' => $distance,
                'result' => $result,
                'extra_height_required' => $extraHeightRequired,
                'calculated_by' => $user->id,
                'calculation_notes' => $request->calculation_notes,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Line of Sight calculated successfully',
                'data' => [
                    'id' => $calculation->id,
                    'pole' => [
                        'id' => $pole->id,
                        'name' => $pole->pole_name,
                        'latitude' => $pole->latitude,
                        'longitude' => $pole->longitude,
                        'height' => $pole->pole_height,
                    ],
                    'agent_location' => [
                        'latitude' => $request->agent_latitude,
                        'longitude' => $request->agent_longitude,
                    ],
                    'elevations' => [
                        'pole_ground_elevation' => round($poleElevation, 2),
                        'pole_top_elevation' => round($poleTopHeight, 2),
                        'agent_elevation' => round($agentElevation, 2),
                        'elevation_difference' => round($elevationDifference, 2),
                    ],
                    'distance_from_pole' => round($distance, 2),
                    'result' => $result,
                    'extra_height_required' => $extraHeightRequired ? round($extraHeightRequired, 2) : null,
                    'calculated_at' => $calculation->created_at->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate Line of Sight: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get calculation history for a specific pole
     */
    public function history(Request $request, $poleId)
    {
        try {
            $pole = Pole::findOrFail($poleId);
            $user = $request->user();

            // Zone access check for regular admins
            if ($user->role === 'admin' && $pole->zone_id !== $user->zone_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only view history for poles in your assigned zone'
                ], 403);
            }

            $calculations = LineOfSightCalculation::where('pole_id', $poleId)
                ->with('calculator:id,name,email')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($calc) {
                    return [
                        'id' => $calc->id,
                        'agent_latitude' => $calc->agent_latitude,
                        'agent_longitude' => $calc->agent_longitude,
                        'agent_elevation' => round($calc->agent_elevation, 2),
                        'pole_elevation' => round($calc->pole_elevation, 2),
                        'elevation_difference' => round($calc->elevation_difference, 2),
                        'distance_from_pole' => round($calc->distance_from_pole, 2),
                        'result' => $calc->result,
                        'extra_height_required' => $calc->extra_height_required ? round($calc->extra_height_required, 2) : null,
                        'calculation_notes' => $calc->calculation_notes,
                        'calculated_by' => $calc->calculator ? [
                            'id' => $calc->calculator->id,
                            'name' => $calc->calculator->name,
                            'email' => $calc->calculator->email,
                        ] : null,
                        'calculated_at' => $calc->created_at->toISOString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $calculations
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch calculation history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all Line of Sight calculations (with pagination)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            $query = LineOfSightCalculation::with(['pole:id,pole_name,zone_id', 'calculator:id,name,email']);

            // Zone filtering for regular admins
            if ($user->role === 'admin') {
                $query->whereHas('pole', function ($q) use ($user) {
                    $q->where('zone_id', $user->zone_id);
                });
            }

            $calculations = $query->orderBy('created_at', 'desc')
                ->paginate(20)
                ->through(function ($calc) {
                    return [
                        'id' => $calc->id,
                        'pole' => $calc->pole ? [
                            'id' => $calc->pole->id,
                            'name' => $calc->pole->pole_name,
                        ] : null,
                        'agent_latitude' => $calc->agent_latitude,
                        'agent_longitude' => $calc->agent_longitude,
                        'distance_from_pole' => round($calc->distance_from_pole, 2),
                        'result' => $calc->result,
                        'extra_height_required' => $calc->extra_height_required ? round($calc->extra_height_required, 2) : null,
                        'calculated_by' => $calc->calculator ? [
                            'name' => $calc->calculator->name,
                        ] : null,
                        'calculated_at' => $calc->created_at->toISOString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $calculations
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch calculations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get elevation data from Google Elevation API
     */
    private function getElevation($latitude, $longitude, $apiKey)
    {
        try {
            $url = "https://maps.googleapis.com/maps/api/elevation/json";

            $response = Http::get($url, [
                'locations' => "{$latitude},{$longitude}",
                'key' => $apiKey,
            ]);

            if (!$response->successful()) {
                \Log::error('Google Elevation API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return null;
            }

            $data = $response->json();

            if (!isset($data['status']) || $data['status'] !== 'OK') {
                \Log::error('Google Elevation API returned error', [
                    'status' => $data['status'] ?? 'UNKNOWN',
                    'error_message' => $data['error_message'] ?? 'No error message'
                ]);
                return null;
            }

            if (!isset($data['results'][0]['elevation'])) {
                \Log::error('Google Elevation API returned no elevation data');
                return null;
            }

            return $data['results'][0]['elevation'];

        } catch (\Exception $e) {
            \Log::error('Exception in getElevation', [
                'message' => $e->getMessage()
            ]);
            return null;
        }
    }
}
