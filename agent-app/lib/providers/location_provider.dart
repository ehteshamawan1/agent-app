import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/location_status.dart';
import '../models/pole.dart';
import '../services/location_service.dart';
import '../services/map_service.dart';

class LocationProvider with ChangeNotifier {
  final LocationService _locationService = LocationService();
  final MapService _mapService = MapService();

  Position? _currentPosition;
  LocationStatus? _locationStatus;
  List<Pole> _poles = [];
  bool _isLoading = false;
  String? _error;
  Timer? _refreshTimer;

  Position? get currentPosition => _currentPosition;
  LocationStatus? get locationStatus => _locationStatus;
  List<Pole> get poles => _poles;
  bool get isLoading => _isLoading;
  String? get error => _error;
  LatLng? get currentLatLng => _currentPosition != null
      ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
      : null;

  // GPS accuracy info
  double? get accuracy => _currentPosition?.accuracy;
  String get accuracyLevel =>
      accuracy != null ? _locationService.getAccuracyLevel(accuracy!) : 'Unknown';
  bool get hasGoodAccuracy =>
      accuracy != null && _locationService.isAccuracyAcceptable(accuracy!);

  // Status helpers
  bool get isGreen => _locationStatus?.isGreen ?? false;
  bool get isRed => _locationStatus?.isRed ?? false;
  bool get isGray => _locationStatus?.isGray ?? true; // Default to gray
  String get statusMessage => _locationStatus?.message ?? 'Checking location...';

  // Request location permission
  Future<bool> requestPermission() async {
    try {
      return await _locationService.requestLocationPermission();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Get current location
  Future<void> getCurrentLocation() async {
    try {
      _currentPosition = await _locationService.getCurrentLocation();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Fetch poles
  Future<void> fetchPoles() async {
    try {
      _poles = await _mapService.getAgentPoles();
      notifyListeners();
    } catch (e) {
      _error = 'Failed to fetch poles: ${e.toString()}';
      notifyListeners();
    }
  }

  // Check location status (GREEN/RED/GRAY)
  Future<void> checkLocationStatus() async {
    if (_currentPosition == null) {
      await getCurrentLocation();
      if (_currentPosition == null) return;
    }

    _isLoading = true;
    notifyListeners();

    try {
      _locationStatus = await _mapService.checkLocationStatus(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
      );

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Failed to check location: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
    }
  }

  // Start auto-refresh (every 10 seconds as per requirements)
  void startAutoRefresh() {
    stopAutoRefresh(); // Cancel existing timer

    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      getCurrentLocation();
      checkLocationStatus();
    });
  }

  // Stop auto-refresh
  void stopAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  // Manual refresh
  Future<void> refresh() async {
    await getCurrentLocation();
    await checkLocationStatus();
  }

  // Initialize (call on app start)
  Future<void> initialize() async {
    final hasPermission = await requestPermission();
    if (!hasPermission) return;

    await fetchPoles();
    await getCurrentLocation();
    await checkLocationStatus();
    startAutoRefresh();
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    stopAutoRefresh();
    super.dispose();
  }
}
