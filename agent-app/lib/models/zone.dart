import 'dart:convert';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class Zone {
  final int id;
  final String zoneName;
  final String zoneBoundary; // JSON string of coordinates
  final String? description;
  final String status;
  final String? createdAt;
  final String? updatedAt;

  Zone({
    required this.id,
    required this.zoneName,
    required this.zoneBoundary,
    this.description,
    required this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory Zone.fromJson(Map<String, dynamic> json) {
    return Zone(
      id: json['id'] as int,
      zoneName: json['zone_name'] as String,
      zoneBoundary: json['zone_boundary'] is String
          ? json['zone_boundary'] as String
          : jsonEncode(json['zone_boundary']),
      description: json['description'] as String?,
      status: json['status'] as String,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'zone_name': zoneName,
      'zone_boundary': zoneBoundary,
      'description': description,
      'status': status,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }

  // Parse zone boundary to list of LatLng
  List<LatLng> getBoundaryPoints() {
    try {
      final List<dynamic> points = jsonDecode(zoneBoundary);

      return points.map((point) {
        return LatLng(
          (point['lat'] as num).toDouble(),
          (point['lng'] as num).toDouble(),
        );
      }).toList();
    } catch (e) {
      return [];
    }
  }

  bool get isActive => status == 'active';
}
