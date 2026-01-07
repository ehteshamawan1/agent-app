<?php

namespace App\Services;

class GeoLocationService
{
    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in meters
     */
    public static function haversineDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // Earth radius in meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c; // Distance in meters
    }

    /**
     * Check if a point is inside a polygon using ray-casting algorithm
     */
    public static function isPointInPolygon($lat, $lng, $polygon)
    {
        $normalized = self::normalizePolygon($polygon);
        if (count($normalized) < 3) {
            return false;
        }

        $inside = false;
        $count = count($normalized);

        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $xi = $normalized[$i]['lng'];
            $yi = $normalized[$i]['lat'];
            $xj = $normalized[$j]['lng'];
            $yj = $normalized[$j]['lat'];

            $intersect = (($yi > $lat) != ($yj > $lat))
                && ($lng < ($xj - $xi) * ($lat - $yi) / ($yj - $yi) + $xi);

            if ($intersect) {
                $inside = !$inside;
            }
        }

        return $inside;
    }

    private static function normalizePolygon($polygon)
    {
        if (is_string($polygon)) {
            $decoded = json_decode($polygon, true);
            $polygon = is_array($decoded) ? $decoded : [];
        } elseif ($polygon instanceof \Illuminate\Support\Collection) {
            $polygon = $polygon->toArray();
        }

        if (!is_array($polygon)) {
            return [];
        }

        $normalized = [];
        foreach ($polygon as $point) {
            if (is_object($point)) {
                $point = (array) $point;
            }

            if (!is_array($point)) {
                continue;
            }

            if (isset($point['lat'], $point['lng'])) {
                $lat = (float) $point['lat'];
                $lng = (float) $point['lng'];
            } elseif (isset($point['latitude'], $point['longitude'])) {
                $lat = (float) $point['latitude'];
                $lng = (float) $point['longitude'];
            } elseif (array_key_exists(0, $point) && array_key_exists(1, $point)) {
                $first = (float) $point[0];
                $second = (float) $point[1];
                $firstLooksLat = $first >= -90 && $first <= 90;
                $secondLooksLat = $second >= -90 && $second <= 90;
                if ($firstLooksLat && !$secondLooksLat) {
                    $lat = $first;
                    $lng = $second;
                } elseif ($secondLooksLat && !$firstLooksLat) {
                    $lat = $second;
                    $lng = $first;
                } else {
                    $lat = $first;
                    $lng = $second;
                }
            } else {
                continue;
            }

            $normalized[] = ['lat' => $lat, 'lng' => $lng];
        }

        return $normalized;
    }

    /**
     * Check agent location status (GREEN/RED/GRAY)
     * Returns nearby poles for map display
     */
    public static function checkLocationStatus($lat, $lng, $zone, $poles)
    {
        // Check if agent is inside their zone
        $insideZone = self::isPointInPolygon($lat, $lng, $zone->zone_boundary);

        if (!$insideZone) {
            return [
                'status' => 'GRAY',
                'message' => 'You are outside your assigned zone',
                'in_zone' => false,
                'can_market' => false,
                'nearby_poles' => [],
            ];
        }

        // Calculate distances for all active poles
        $polesWithDistance = [];
        $closestRestrictedPole = null;
        $closestRestrictedDistance = null;

        foreach ($poles as $pole) {
            if ($pole->status !== 'active') {
                continue;
            }

            $distance = self::haversineDistance($lat, $lng, $pole->latitude, $pole->longitude);

            // Add to nearby poles list (will be sorted later)
            $polesWithDistance[] = [
                'id' => $pole->id,
                'pole_name' => $pole->pole_name,
                'latitude' => $pole->latitude,
                'longitude' => $pole->longitude,
                'pole_height' => $pole->pole_height,
                'restricted_radius' => $pole->restricted_radius,
                'status' => $pole->status,
                'zone_id' => $pole->zone_id,
                'distance' => round($distance, 2),
                'is_restricted' => $distance <= $pole->restricted_radius,
            ];

            // Check if inside restricted radius
            if ($distance <= $pole->restricted_radius) {
                if ($closestRestrictedDistance === null || $distance < $closestRestrictedDistance) {
                    $closestRestrictedPole = $pole;
                    $closestRestrictedDistance = $distance;
                }
            }
        }

        // Sort poles by distance and get nearest 10
        usort($polesWithDistance, function ($a, $b) {
            return $a['distance'] <=> $b['distance'];
        });
        $nearbyPoles = array_slice($polesWithDistance, 0, 10);

        // If inside any restricted radius, return RED
        if ($closestRestrictedPole) {
            return [
                'status' => 'RED',
                'message' => 'Marketing NOT allowed - Too close to pole',
                'in_zone' => true,
                'can_market' => false,
                'nearest_pole' => $closestRestrictedPole->pole_name,
                'distance_to_pole' => round($closestRestrictedDistance, 2),
                'nearby_poles' => $nearbyPoles,
            ];
        }

        return [
            'status' => 'GREEN',
            'message' => 'Marketing allowed - Clear area',
            'in_zone' => true,
            'can_market' => true,
            'nearby_poles' => $nearbyPoles,
        ];
    }

    /**
     * Get nearby poles for map display (zone-filtered)
     * Returns up to $limit poles sorted by distance
     */
    public static function getNearbyPoles($lat, $lng, $poles, $limit = 10)
    {
        $polesWithDistance = [];

        foreach ($poles as $pole) {
            if ($pole->status !== 'active') {
                continue;
            }

            $distance = self::haversineDistance($lat, $lng, $pole->latitude, $pole->longitude);

            $polesWithDistance[] = [
                'id' => $pole->id,
                'pole_name' => $pole->pole_name,
                'latitude' => $pole->latitude,
                'longitude' => $pole->longitude,
                'pole_height' => $pole->pole_height,
                'restricted_radius' => $pole->restricted_radius,
                'status' => $pole->status,
                'zone_id' => $pole->zone_id,
                'distance' => round($distance, 2),
                'is_restricted' => $distance <= $pole->restricted_radius,
            ];
        }

        // Sort by distance
        usort($polesWithDistance, function ($a, $b) {
            return $a['distance'] <=> $b['distance'];
        });

        return array_slice($polesWithDistance, 0, $limit);
    }
}
