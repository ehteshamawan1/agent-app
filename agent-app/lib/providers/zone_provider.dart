import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/zone.dart';
import '../services/zone_service.dart';

class ZoneProvider with ChangeNotifier {
  final ZoneService _zoneService = ZoneService();

  Zone? _zone;
  List<LatLng> _boundaryPoints = [];
  bool _isLoading = false;
  String? _error;

  Zone? get zone => _zone;
  List<LatLng> get boundaryPoints => _boundaryPoints;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasZone => _zone != null;
  String get zoneName => _zone?.zoneName ?? 'No Zone Assigned';

  // Fetch agent's zone
  Future<void> fetchAgentZone() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _zone = await _zoneService.getAgentZone();

      if (_zone != null) {
        _boundaryPoints = _zone!.getBoundaryPoints();
      } else {
        _error = 'No zone assigned to your account';
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Failed to fetch zone: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
    }
  }

  // Check if location is in zone
  bool isLocationInZone(LatLng location) {
    if (_boundaryPoints.isEmpty) return false;
    return _zoneService.isPointInZone(location, _boundaryPoints);
  }

  // Get zone center for map
  LatLng getZoneCenter() {
    if (_boundaryPoints.isEmpty) {
      return const LatLng(31.5204, 74.3587); // Default: Lahore
    }
    return _zoneService.getPolygonCenter(_boundaryPoints);
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
