<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('zone');

        // Filter by role if provided
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->latest()->get();
        return response()->json(['users' => $users]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:super_admin,admin,agent',
            'zone_id' => 'required_if:role,admin,agent|nullable|exists:zones,id',
            'mobile' => 'nullable|string|max:20',
            'status' => 'in:active,inactive',
        ]);

        // Super admin should not have a zone
        if ($validated['role'] === 'super_admin') {
            $validated['zone_id'] = null;
            $validated['is_super_admin'] = true;
        } else {
            $validated['is_super_admin'] = false;
        }

        // Admin and agent must have a zone
        if (in_array($validated['role'], ['admin', 'agent']) && !$validated['zone_id']) {
            return response()->json(['message' => 'Admin and agent users must be assigned to a zone'], 422);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'zone_id' => $validated['zone_id'] ?? null,
            'mobile' => $validated['mobile'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'is_super_admin' => $validated['is_super_admin'] ?? false,
        ]);

        return response()->json(['message' => 'User created successfully', 'user' => $user->load('zone')], 201);
    }

    public function show($id)
    {
        $user = User::with('zone')->findOrFail($id);
        return response()->json(['user' => $user]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Prevent modifying super admin role
        if ($user->is_super_admin && $request->has('role') && $request->role !== 'super_admin') {
            return response()->json(['message' => 'Cannot change super admin role'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|in:super_admin,admin,agent',
            'zone_id' => 'nullable|exists:zones,id',
            'mobile' => 'nullable|string|max:20',
            'status' => 'in:active,inactive',
        ]);

        // Hash password if provided
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        // Role change validation
        if (isset($validated['role'])) {
            if ($validated['role'] === 'super_admin') {
                $validated['zone_id'] = null;
                $validated['is_super_admin'] = true;
            } else {
                $validated['is_super_admin'] = false;
                // Admin and agent must have zone
                if (in_array($validated['role'], ['admin', 'agent']) && !$user->zone_id && !isset($validated['zone_id'])) {
                    return response()->json(['message' => 'Admin and agent users must be assigned to a zone'], 422);
                }
            }
        }

        $user->update($validated);
        return response()->json(['message' => 'User updated successfully', 'user' => $user->load('zone')]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Prevent super admin deletion
        if ($user->is_super_admin) {
            return response()->json(['message' => 'Cannot delete super admin user'], 403);
        }

        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);

        if ($user->is_super_admin) {
            return response()->json(['message' => 'Cannot change super admin status'], 403);
        }

        $user->status = $user->status === 'active' ? 'inactive' : 'active';
        $user->save();

        return response()->json(['message' => 'User status updated successfully', 'user' => $user->load('zone')]);
    }

    public function admins()
    {
        $users = User::with('zone')->where('role', 'admin')->latest()->get();
        return response()->json(['users' => $users]);
    }

    public function agents()
    {
        $users = User::with('zone')->where('role', 'agent')->latest()->get();
        return response()->json(['users' => $users]);
    }
}
