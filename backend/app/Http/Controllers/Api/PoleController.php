<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pole;
use App\Models\Zone;
use App\Services\GeoLocationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PoleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Pole::with(['zone', 'landOwner', 'creator']);

        // Zone-based filtering for admins
        if ($user->role === 'admin' && $user->zone_id) {
            $query->where('zone_id', $user->zone_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $poles = $query->latest()->get();
        return response()->json(['poles' => $poles]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'pole_name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'pole_height' => 'required|numeric|min:0',
            'restricted_radius' => 'required|numeric|min:50|max:5000',
            'zone_id' => 'nullable|exists:zones,id',
            'land_owner_id' => 'nullable|exists:land_owners,id',
            'status' => 'in:active,inactive',
        ]);

        if ($user->role === 'admin') {
            $validated['zone_id'] = $user->zone_id;
        }

        if ($user->role === 'super_admin' && empty($validated['zone_id'])) {
            return response()->json(['message' => 'Zone is required for super admin'], 422);
        }

        // Admin can only create poles in their zone
        if ($user->role === 'admin' && $validated['zone_id'] != $user->zone_id) {
            return response()->json(['message' => 'You can only create poles in your assigned zone'], 403);
        }

        // Validate pole is within zone boundary
        $zone = Zone::findOrFail($validated['zone_id']);
        $isInZone = GeoLocationService::isPointInPolygon(
            $validated['latitude'],
            $validated['longitude'],
            $zone->zone_boundary
        );

        if (!$isInZone) {
            return response()->json(['message' => 'Pole coordinates must be within zone boundary'], 422);
        }

        $overlapPole = $this->findOverlappingPole(
            $validated['zone_id'],
            $validated['latitude'],
            $validated['longitude'],
            $validated['restricted_radius']
        );
        if ($overlapPole) {
            return response()->json([
                'message' => "Pole radius overlaps with existing pole: {$overlapPole->pole_name}",
            ], 422);
        }

        $pole = Pole::create([
            'pole_name' => $validated['pole_name'],
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'pole_height' => $validated['pole_height'],
            'restricted_radius' => $validated['restricted_radius'],
            'zone_id' => $validated['zone_id'],
            'land_owner_id' => $validated['land_owner_id'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'created_by' => $user->id,
        ]);

        // Clear cache for this zone
        self::clearZoneCache($validated['zone_id']);

        return response()->json(['message' => 'Pole created successfully', 'pole' => $pole->load(['zone', 'landOwner'])], 201);
    }

    public function show($id)
    {
        $user = auth()->user();
        $pole = Pole::with(['zone', 'landOwner', 'creator'])->findOrFail($id);

        // Zone access check for admin
        if ($user->role === 'admin' && $pole->zone_id != $user->zone_id) {
            return response()->json(['message' => 'Access denied to this pole'], 403);
        }

        return response()->json(['pole' => $pole]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $pole = Pole::findOrFail($id);

        // Zone access check for admin
        if ($user->role === 'admin' && $pole->zone_id != $user->zone_id) {
            return response()->json(['message' => 'Access denied to this pole'], 403);
        }

        $validated = $request->validate([
            'pole_name' => 'sometimes|string|max:255',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'pole_height' => 'sometimes|numeric|min:0',
            'restricted_radius' => 'sometimes|numeric|min:50|max:5000',
            'land_owner_id' => 'nullable|exists:land_owners,id',
            'status' => 'in:active,inactive',
        ]);

        // Validate new coordinates are in zone if changed
        if (isset($validated['latitude']) && isset($validated['longitude'])) {
            $isInZone = GeoLocationService::isPointInPolygon(
                $validated['latitude'],
                $validated['longitude'],
                $pole->zone->zone_boundary
            );

            if (!$isInZone) {
                return response()->json(['message' => 'Pole coordinates must be within zone boundary'], 422);
            }
        }

        $newLatitude = $validated['latitude'] ?? $pole->latitude;
        $newLongitude = $validated['longitude'] ?? $pole->longitude;
        $newRadius = $validated['restricted_radius'] ?? $pole->restricted_radius;
        $overlapPole = $this->findOverlappingPole(
            $pole->zone_id,
            $newLatitude,
            $newLongitude,
            $newRadius,
            $pole->id
        );
        if ($overlapPole) {
            return response()->json([
                'message' => "Pole radius overlaps with existing pole: {$overlapPole->pole_name}",
            ], 422);
        }

        $pole->update($validated);

        // Clear cache for this pole's zone
        self::clearZoneCache($pole->zone_id);

        return response()->json(['message' => 'Pole updated successfully', 'pole' => $pole->load(['zone', 'landOwner'])]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $pole = Pole::findOrFail($id);

        // Zone access check for admin
        if ($user->role === 'admin' && $pole->zone_id != $user->zone_id) {
            return response()->json(['message' => 'Access denied to this pole'], 403);
        }

        $zoneId = $pole->zone_id;
        $pole->delete();

        // Clear cache for this pole's zone
        self::clearZoneCache($zoneId);

        return response()->json(['message' => 'Pole deleted successfully']);
    }

    public function toggleStatus($id)
    {
        $user = auth()->user();
        $pole = Pole::findOrFail($id);

        if ($user->role === 'admin' && $pole->zone_id != $user->zone_id) {
            return response()->json(['message' => 'Access denied to this pole'], 403);
        }

        $pole->status = $pole->status === 'active' ? 'inactive' : 'active';
        $pole->save();

        self::clearZoneCache($pole->zone_id);

        return response()->json(['message' => 'Pole status updated successfully', 'pole' => $pole->load(['zone', 'landOwner'])]);
    }

    public function getByZone(Request $request, $zoneId)
    {
        $user = $request->user();
        if ($user->role !== 'super_admin') {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $poles = Pole::with(['zone', 'landOwner', 'creator'])
            ->where('zone_id', $zoneId)
            ->latest()
            ->get();

        return response()->json(['poles' => $poles]);
    }

    public function mapPoles(Request $request)
    {
        $user = $request->user();
        $query = Pole::with(['zone', 'landOwner'])
            ->where('status', 'active');

        if ($user->role === 'admin' && $user->zone_id) {
            $query->where('zone_id', $user->zone_id);
        }

        if ($user->role === 'agent' && $user->zone_id) {
            $query->where('zone_id', $user->zone_id);
        }

        $poles = $query->get();
        return response()->json(['poles' => $poles]);
    }

    public function agentPoles(Request $request)
    {
        $user = $request->user();
        if (!$user->zone_id) {
            return response()->json(['message' => 'No zone assigned', 'data' => []]);
        }

        $poles = Pole::where('zone_id', $user->zone_id)
            ->where('status', 'active')
            ->get();

        return response()->json(['data' => $poles]);
    }

    /**
     * Check agent location status (GREEN/RED/GRAY)
     * Optimized with caching for performance
     */
    public function checkLocation(Request $request)
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();

        if (!$user->zone_id) {
            return response()->json([
                'status' => 'GRAY',
                'message' => 'You are not assigned to any zone. Contact administrator.',
                'can_market' => false,
                'nearby_poles' => [],
            ]);
        }

        // Cache zone data for 1 hour (zones rarely change)
        $zone = Cache::remember("zone_{$user->zone_id}", 3600, function () use ($user) {
            return Zone::findOrFail($user->zone_id);
        });

        // Cache active poles per zone for 5 minutes (poles may be added/updated)
        $poles = Cache::remember("active_poles_zone_{$user->zone_id}", 300, function () use ($user) {
            return Pole::where('zone_id', $user->zone_id)
                ->where('status', 'active')
                ->select(['id', 'pole_name', 'latitude', 'longitude', 'pole_height', 'restricted_radius', 'status', 'zone_id', 'land_owner_id'])
                ->get();
        });

        $locationStatus = GeoLocationService::checkLocationStatus(
            $validated['latitude'],
            $validated['longitude'],
            $zone,
            $poles
        );

        return response()->json($locationStatus);
    }

    /**
     * Clear zone and poles cache (call when zone/poles are updated)
     */
    public static function clearZoneCache($zoneId)
    {
        Cache::forget("zone_{$zoneId}");
        Cache::forget("active_poles_zone_{$zoneId}");
    }

    private function findOverlappingPole($zoneId, $latitude, $longitude, $restrictedRadius, $ignorePoleId = null)
    {
        $query = Pole::where('zone_id', $zoneId)->select([
            'id',
            'pole_name',
            'latitude',
            'longitude',
            'restricted_radius',
        ]);

        if ($ignorePoleId) {
            $query->where('id', '!=', $ignorePoleId);
        }

        $poles = $query->get();
        foreach ($poles as $pole) {
            $distance = GeoLocationService::haversineDistance(
                $latitude,
                $longitude,
                $pole->latitude,
                $pole->longitude
            );
            if ($distance < ($restrictedRadius + $pole->restricted_radius)) {
                return $pole;
            }
        }

        return null;
    }
}
