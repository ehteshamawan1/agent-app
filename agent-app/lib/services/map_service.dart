import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/pole.dart';
import '../models/location_status.dart';
import 'api_service.dart';

class MapService {
  final ApiService _apiService = ApiService();

  // Fetch poles for agent's zone
  Future<List<Pole>> getAgentPoles() async {
    try {
      final response = await _apiService.get('/agent/poles');
      final poles = (response['data'] as List)
          .map((poleJson) => Pole.fromJson(poleJson))
          .toList();
      return poles;
    } catch (e) {
      throw Exception('Failed to fetch poles: $e');
    }
  }

  // Check location status (GREEN/RED/GRAY)
  Future<LocationStatus> checkLocationStatus(
    double latitude,
    double longitude,
  ) async {
    try {
      final response = await _apiService.post('/check-location', {
        'latitude': latitude,
        'longitude': longitude,
      });

      return LocationStatus.fromJson(response);
    } catch (e) {
      throw Exception('Failed to check location status: $e');
    }
  }

  // Create markers for poles
  Set<Marker> createPoleMarkers(
    List<Pole> poles,
    Function(Pole) onMarkerTap,
  ) {
    return poles.map((pole) {
      return Marker(
        markerId: MarkerId('pole_${pole.id}'),
        position: LatLng(pole.latitude, pole.longitude),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          pole.isActive ? BitmapDescriptor.hueRed : BitmapDescriptor.hueOrange,
        ),
        infoWindow: InfoWindow(
          title: pole.poleName,
          snippet: 'Radius: ${pole.restrictedRadius.toStringAsFixed(0)}m',
        ),
        onTap: () => onMarkerTap(pole),
      );
    }).toSet();
  }

  // Create circles for restricted radius
  Set<Circle> createRestrictedCircles(List<Pole> poles) {
    return poles.map((pole) {
      return Circle(
        circleId: CircleId('circle_${pole.id}'),
        center: LatLng(pole.latitude, pole.longitude),
        radius: pole.restrictedRadius,
        fillColor: pole.isActive
            ? const Color(0x44FF0000) // Semi-transparent red
            : const Color(0x44FFA500), // Semi-transparent orange
        strokeColor: pole.isActive
            ? const Color(0xFFFF0000) // Red
            : const Color(0xFFFFA500), // Orange
        strokeWidth: 2,
      );
    }).toSet();
  }

  // Create polygon for zone boundary
  Set<Polygon> createZoneBoundaryPolygon(
    List<LatLng> boundaryPoints,
    String zoneName,
  ) {
    if (boundaryPoints.isEmpty) return {};

    return {
      Polygon(
        polygonId: const PolygonId('agent_zone'),
        points: boundaryPoints,
        fillColor: const Color(0x220000FF), // Semi-transparent blue
        strokeColor: const Color(0xFF0000FF), // Blue
        strokeWidth: 3,
        geodesic: true,
      ),
    };
  }

  // Calculate bounds for map camera
  LatLngBounds? calculateBounds(List<LatLng> points) {
    if (points.isEmpty) return null;

    double south = points.first.latitude;
    double north = points.first.latitude;
    double west = points.first.longitude;
    double east = points.first.longitude;

    for (final point in points) {
      if (point.latitude < south) south = point.latitude;
      if (point.latitude > north) north = point.latitude;
      if (point.longitude < west) west = point.longitude;
      if (point.longitude > east) east = point.longitude;
    }

    return LatLngBounds(
      southwest: LatLng(south, west),
      northeast: LatLng(north, east),
    );
  }
}
