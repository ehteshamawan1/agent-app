<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Zone;
use App\Services\GeoLocationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ZoneController extends Controller
{
    public function index()
    {
        $zones = Zone::with('creator')->withCount('users')->latest()->get();
        return response()->json(['zones' => $zones]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'zone_name' => 'required|string|max:255|unique:zones',
            'zone_boundary' => 'required|array|min:3',
            'zone_boundary.*.lat' => 'required|numeric',
            'zone_boundary.*.lng' => 'required|numeric',
            'description' => 'nullable|string',
            'status' => 'in:active,inactive',
        ]);

        $zone = Zone::create([
            'zone_name' => $validated['zone_name'],
            'zone_boundary' => $validated['zone_boundary'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'created_by' => auth()->id(),
        ]);

        return response()->json(['message' => 'Zone created successfully', 'zone' => $zone->load('creator')], 201);
    }

    public function show($id)
    {
        $zone = Zone::with(['creator', 'users', 'poles', 'landOwners'])->findOrFail($id);
        return response()->json(['zone' => $zone]);
    }

    public function update(Request $request, $id)
    {
        $zone = Zone::findOrFail($id);
        $validated = $request->validate([
            'zone_name' => 'sometimes|string|max:255|unique:zones,zone_name,' . $id,
            'zone_boundary' => 'sometimes|array|min:3',
            'description' => 'nullable|string',
            'status' => 'in:active,inactive',
        ]);
        $zone->update($validated);

        // Clear cache for this zone
        Cache::forget("zone_{$id}");
        Cache::forget("active_poles_zone_{$id}");

        return response()->json(['message' => 'Zone updated successfully', 'zone' => $zone]);
    }

    public function destroy($id)
    {
        $zone = Zone::findOrFail($id);
        if ($zone->users()->count() > 0 || $zone->poles()->count() > 0) {
            return response()->json(['message' => 'Cannot delete zone with assigned resources'], 422);
        }
        $zone->delete();

        // Clear cache for this zone
        Cache::forget("zone_{$id}");
        Cache::forget("active_poles_zone_{$id}");

        return response()->json(['message' => 'Zone deleted successfully']);
    }

    public function toggleStatus($id)
    {
        $zone = Zone::findOrFail($id);
        $zone->status = $zone->status === 'active' ? 'inactive' : 'active';
        $zone->save();

        Cache::forget("zone_{$id}");
        Cache::forget("active_poles_zone_{$id}");

        return response()->json([
            'message' => 'Zone status updated successfully',
            'zone' => $zone->load('creator')
        ]);
    }

    public function users($zoneId)
    {
        $zone = Zone::with('users')->findOrFail($zoneId);
        return response()->json(['users' => $zone->users]);
    }

    public function mapZones()
    {
        $zones = Zone::where('status', 'active')->get();
        return response()->json(['zones' => $zones]);
    }

    public function agentZone(Request $request)
    {
        $user = $request->user();
        if (!$user->zone_id) {
            return response()->json(['message' => 'No zone assigned'], 404);
        }

        $zone = Zone::findOrFail($user->zone_id);
        return response()->json(['zone' => $zone]);
    }
}
