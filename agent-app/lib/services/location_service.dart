import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

class LocationService {
  // Request location permissions
  Future<bool> requestLocationPermission() async {
    // Check if location services are enabled
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled. Please enable GPS.');
    }

    // Request permission
    var permission = await Permission.location.status;

    if (permission.isDenied) {
      permission = await Permission.location.request();
    }

    if (permission.isPermanentlyDenied) {
      // Open app settings
      await openAppSettings();
      throw Exception('Location permission is permanently denied. Please enable it in app settings.');
    }

    return permission.isGranted;
  }

  // Get current location
  Future<Position> getCurrentLocation() async {
    try {
      // Request permission first
      final hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw Exception('Location permission not granted');
      }

      // Get current position with high accuracy
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      return position;
    } catch (e) {
      throw Exception('Failed to get location: $e');
    }
  }

  // Get location accuracy level
  String getAccuracyLevel(double accuracy) {
    if (accuracy <= 10) return 'Excellent';
    if (accuracy <= 20) return 'Good';
    if (accuracy <= 50) return 'Fair';
    return 'Poor';
  }

  // Check if accuracy is acceptable (< 50m as per requirements)
  bool isAccuracyAcceptable(double accuracy) {
    return accuracy <= 50;
  }

  // Stream location updates
  Stream<Position> getLocationStream() {
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // Update every 10 meters
    );

    return Geolocator.getPositionStream(locationSettings: locationSettings);
  }

  // Calculate distance between two points (Haversine formula)
  double calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
  }
}
