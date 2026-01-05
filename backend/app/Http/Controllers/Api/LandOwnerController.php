<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LandOwner;
use Illuminate\Http\Request;

class LandOwnerController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LandOwner::with(['zone', 'creator', 'poles']);

        // Zone-based filtering for admins
        if ($user->role === 'admin' && $user->zone_id) {
            $query->where('zone_id', $user->zone_id);
        }

        $landOwners = $query->latest()->get();
        return response()->json(['land_owners' => $landOwners]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'owner_name' => 'required|string|max:255',
            'mobile_number' => 'required|string|max:20',
            'address' => 'required|string',
            'notes' => 'nullable|string',
            'zone_id' => 'nullable|exists:zones,id',
        ]);

        if ($user->role === 'admin') {
            $validated['zone_id'] = $user->zone_id;
        }

        if ($user->role === 'super_admin' && empty($validated['zone_id'])) {
            return response()->json(['message' => 'Zone is required for super admin'], 422);
        }

        // Admin can only create land owners in their zone
        if ($user->role === 'admin' && $validated['zone_id'] != $user->zone_id) {
            return response()->json(['message' => 'You can only create land owners in your assigned zone'], 403);
        }

        $landOwner = LandOwner::create([
            'owner_name' => $validated['owner_name'],
            'mobile_number' => $validated['mobile_number'],
            'address' => $validated['address'],
            'notes' => $validated['notes'] ?? null,
            'zone_id' => $validated['zone_id'],
            'created_by' => $user->id,
        ]);

        return response()->json(['message' => 'Land owner created successfully', 'land_owner' => $landOwner->load('zone')], 201);
    }

    public function show($id)
    {
        $user = auth()->user();
        $landOwner = LandOwner::with(['zone', 'creator', 'poles'])->findOrFail($id);

        // Zone access check for admin
        if ($user->role === 'admin' && $landOwner->zone_id != $user->zone_id) {
            return response()->json(['message' => 'Access denied to this land owner'], 403);
        }

        return response()->json(['land_owner' => $landOwner]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $landOwner = LandOwner::findOrFail($id);

        // Zone access check for admin
        if ($user->role === 'admin' && $landOwner->zone_id != $user->zone_id) {
            return response()->json(['message' => 'Access denied to this land owner'], 403);
        }

        $validated = $request->validate([
            'owner_name' => 'sometimes|string|max:255',
            'mobile_number' => 'sometimes|string|max:20',
            'address' => 'sometimes|string',
            'notes' => 'nullable|string',
        ]);

        $landOwner->update($validated);
        return response()->json(['message' => 'Land owner updated successfully', 'land_owner' => $landOwner->load('zone')]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $landOwner = LandOwner::findOrFail($id);

        // Zone access check for admin
        if ($user->role === 'admin' && $landOwner->zone_id != $user->zone_id) {
            return response()->json(['message' => 'Access denied to this land owner'], 403);
        }

        // Check if land owner has associated poles
        if ($landOwner->poles()->count() > 0) {
            return response()->json(['message' => 'Cannot delete land owner with associated poles. Remove pole associations first.'], 422);
        }

        $landOwner->delete();
        return response()->json(['message' => 'Land owner deleted successfully']);
    }
}
