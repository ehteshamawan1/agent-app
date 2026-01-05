import 'dart:convert';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/zone.dart';
import 'api_service.dart';

class ZoneService {
  final ApiService _apiService = ApiService();

  // Fetch agent's assigned zone from backend
  Future<Zone?> getAgentZone() async {
    try {
      final response = await _apiService.get('/agent/zone');

      if (response['zone'] != null) {
        final zone = Zone.fromJson(response['zone']);

        // Cache zone data for offline access
        await _cacheZone(zone);

        return zone;
      }
      return null;
    } catch (e) {
      print('Error fetching agent zone: $e');
      // Try to get cached zone
      return await _getCachedZone();
    }
  }

  // Cache zone data locally
  Future<void> _cacheZone(Zone zone) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cached_zone', jsonEncode(zone.toJson()));
  }

  // Get cached zone data
  Future<Zone?> _getCachedZone() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final zoneJson = prefs.getString('cached_zone');
      if (zoneJson != null) {
        return Zone.fromJson(jsonDecode(zoneJson));
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Point-in-polygon check (Ray casting algorithm)
  // Returns true if the point is inside the polygon
  bool isPointInZone(LatLng point, List<LatLng> polygon) {
    if (polygon.length < 3) return false;

    bool inside = false;
    int j = polygon.length - 1;

    for (int i = 0; i < polygon.length; i++) {
      final xi = polygon[i].longitude;
      final yi = polygon[i].latitude;
      final xj = polygon[j].longitude;
      final yj = polygon[j].latitude;

      final intersect = ((yi > point.latitude) != (yj > point.latitude)) &&
          (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;

      j = i;
    }

    return inside;
  }

  // Check if current location is within agent's zone
  Future<bool> isLocationInAgentZone(LatLng location) async {
    try {
      final zone = await getAgentZone();
      if (zone == null) return false;

      final boundary = zone.getBoundaryPoints();
      if (boundary.isEmpty) return false;

      return isPointInZone(location, boundary);
    } catch (e) {
      print('Error checking location in zone: $e');
      return false;
    }
  }

  // Parse zone boundary from JSON string
  List<LatLng> parseZoneBoundary(String boundaryJson) {
    try {
      final List<dynamic> points = jsonDecode(boundaryJson);
      return points.map((point) {
        return LatLng(
          (point['lat'] as num).toDouble(),
          (point['lng'] as num).toDouble(),
        );
      }).toList();
    } catch (e) {
      print('Error parsing zone boundary: $e');
      return [];
    }
  }

  // Calculate center of polygon for map centering
  LatLng getPolygonCenter(List<LatLng> polygon) {
    if (polygon.isEmpty) return const LatLng(0, 0);

    double totalLat = 0;
    double totalLng = 0;

    for (final point in polygon) {
      totalLat += point.latitude;
      totalLng += point.longitude;
    }

    return LatLng(
      totalLat / polygon.length,
      totalLng / polygon.length,
    );
  }
}
