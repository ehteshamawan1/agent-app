<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckZoneAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Super admins have access to all zones
        if ($user->is_super_admin || $user->role === 'super_admin') {
            return $next($request);
        }

        // Agents don't create/update resources, so zone check happens in location check API
        if ($user->role === 'agent') {
            return $next($request);
        }

        // Admins must have a zone assigned
        if ($user->role === 'admin' && !$user->zone_id) {
            return response()->json([
                'message' => 'Your account is not assigned to a zone. Contact super admin.'
            ], 403);
        }

        return $next($request);
    }
}
