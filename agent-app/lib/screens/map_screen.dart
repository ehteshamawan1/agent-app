import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/zone_provider.dart';
import '../providers/location_provider.dart';
import '../widgets/status_indicator.dart';
import '../widgets/zone_indicator.dart';
import '../services/map_service.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapService _mapService = MapService();
  GoogleMapController? _mapController;
  bool _isInitialized = false;
  String? _googleMapsApiKey;
  bool _showRestrictedCircles = true;
  bool _showZoneBoundary = true;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      // Get Google Maps API key
      _googleMapsApiKey = await ApiService().getGoogleMapsApiKey();

      if (!mounted) return;

      // Initialize providers
      final zoneProvider = Provider.of<ZoneProvider>(context, listen: false);
      final locationProvider = Provider.of<LocationProvider>(context, listen: false);

      // Fetch zone data
      await zoneProvider.fetchAgentZone();

      // Initialize location tracking
      await locationProvider.initialize();

      setState(() {
        _isInitialized = true;
      });

      // Move camera to zone center
      if (zoneProvider.hasZone) {
        _moveCameraToZone();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Initialization error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _moveCameraToZone() {
    final zoneProvider = Provider.of<ZoneProvider>(context, listen: false);
    if (_mapController != null && zoneProvider.boundaryPoints.isNotEmpty) {
      final bounds = _mapService.calculateBounds(zoneProvider.boundaryPoints);
      if (bounds != null) {
        _mapController!.animateCamera(
          CameraUpdate.newLatLngBounds(bounds, 50),
        );
      }
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final locationProvider = Provider.of<LocationProvider>(context, listen: false);

      locationProvider.stopAutoRefresh();
      await authProvider.logout();

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }
    }
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized || _googleMapsApiKey == null) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // Google Map
          Consumer3<ZoneProvider, LocationProvider, AuthProvider>(
            builder: (context, zoneProvider, locationProvider, authProvider, child) {
              final currentLocation = locationProvider.currentLatLng;

              // Create markers for current location and poles
              Set<Marker> markers = {};

              // Current location marker
              if (currentLocation != null) {
                markers.add(
                  Marker(
                    markerId: const MarkerId('current_location'),
                    position: currentLocation,
                    icon: BitmapDescriptor.defaultMarkerWithHue(
                      BitmapDescriptor.hueBlue,
                    ),
                    infoWindow: const InfoWindow(
                      title: 'Your Location',
                    ),
                  ),
                );
              }

              // Pole markers
              if (locationProvider.poles.isNotEmpty) {
                markers.addAll(
                  _mapService.createPoleMarkers(
                    locationProvider.poles,
                    (pole) {
                      // Show pole details
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: Text(pole.poleName),
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Height: ${pole.poleHeight}m'),
                              Text('Restricted Radius: ${pole.restrictedRadius}m'),
                              if (pole.distance != null)
                                Text('Distance: ${pole.distance!.toStringAsFixed(1)}m'),
                              Text('Status: ${pole.status}'),
                            ],
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Close'),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                );
              }

              // Create circles for restricted radius
              Set<Circle> circles = {};
              if (_showRestrictedCircles && locationProvider.poles.isNotEmpty) {
                circles = _mapService.createRestrictedCircles(locationProvider.poles);
              }

              // Create polygon for zone boundary
              Set<Polygon> polygons = {};
              if (_showZoneBoundary && zoneProvider.boundaryPoints.isNotEmpty) {
                polygons = _mapService.createZoneBoundaryPolygon(
                  zoneProvider.boundaryPoints,
                  zoneProvider.zoneName,
                );
              }

              return GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: currentLocation ?? zoneProvider.getZoneCenter(),
                  zoom: 14,
                ),
                onMapCreated: (controller) {
                  _mapController = controller;
                  _moveCameraToZone();
                },
                markers: markers,
                circles: circles,
                polygons: polygons,
                myLocationEnabled: true,
                myLocationButtonEnabled: true,
                mapToolbarEnabled: false,
                zoomControlsEnabled: false,
              );
            },
          ),

          // Status Indicator (Top)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Consumer<LocationProvider>(
              builder: (context, locationProvider, child) {
                return StatusIndicator(
                  status: locationProvider.locationStatus,
                  isLoading: locationProvider.isLoading,
                );
              },
            ),
          ),

          // Zone Indicator (Below status)
          Positioned(
            top: 160,
            left: 0,
            right: 0,
            child: Consumer<ZoneProvider>(
              builder: (context, zoneProvider, child) {
                return Center(
                  child: ZoneIndicator(
                    zoneName: zoneProvider.zoneName,
                    isInZone: zoneProvider.hasZone,
                  ),
                );
              },
            ),
          ),

          // GPS Accuracy Warning (If poor)
          Positioned(
            top: 220,
            left: 16,
            right: 16,
            child: Consumer<LocationProvider>(
              builder: (context, locationProvider, child) {
                if (locationProvider.hasGoodAccuracy ||
                    locationProvider.accuracy == null) {
                  return const SizedBox.shrink();
                }

                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning, color: Colors.white),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'GPS accuracy is low (${locationProvider.accuracy!.toStringAsFixed(0)}m). Location may not be precise.',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // Control buttons (Bottom right)
          Positioned(
            bottom: 100,
            right: 16,
            child: Column(
              children: [
                // Toggle restricted circles
                FloatingActionButton(
                  heroTag: 'toggle_circles',
                  mini: true,
                  backgroundColor: Colors.white,
                  onPressed: () {
                    setState(() {
                      _showRestrictedCircles = !_showRestrictedCircles;
                    });
                  },
                  child: Icon(
                    _showRestrictedCircles ? Icons.circle : Icons.circle_outlined,
                    color: Colors.red,
                  ),
                ),
                const SizedBox(height: 8),
                // Toggle zone boundary
                FloatingActionButton(
                  heroTag: 'toggle_boundary',
                  mini: true,
                  backgroundColor: Colors.white,
                  onPressed: () {
                    setState(() {
                      _showZoneBoundary = !_showZoneBoundary;
                    });
                  },
                  child: Icon(
                    _showZoneBoundary ? Icons.border_all : Icons.border_clear,
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(height: 8),
                // Refresh location
                FloatingActionButton(
                  heroTag: 'refresh',
                  mini: true,
                  backgroundColor: Colors.white,
                  onPressed: () {
                    Provider.of<LocationProvider>(context, listen: false).refresh();
                  },
                  child: const Icon(Icons.refresh, color: Colors.blue),
                ),
                const SizedBox(height: 8),
                // Logout button
                FloatingActionButton(
                  heroTag: 'logout',
                  mini: true,
                  backgroundColor: Colors.white,
                  onPressed: _logout,
                  child: const Icon(Icons.logout, color: Colors.red),
                ),
              ],
            ),
          ),

          // User info (Bottom left)
          Positioned(
            bottom: 16,
            left: 16,
            child: Consumer2<AuthProvider, LocationProvider>(
              builder: (context, authProvider, locationProvider, child) {
                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        authProvider.user?.name ?? 'Agent',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'GPS: ${locationProvider.accuracyLevel}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[700],
                        ),
                      ),
                      if (locationProvider.accuracy != null)
                        Text(
                          '±${locationProvider.accuracy!.toStringAsFixed(0)}m',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey[600],
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
