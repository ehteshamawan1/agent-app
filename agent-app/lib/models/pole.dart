class Pole {
  final int id;
  final String poleName;
  final double latitude;
  final double longitude;
  final double poleHeight;
  final double restrictedRadius;
  final String status;
  final int? zoneId;
  final int? landOwnerId;
  final String? createdAt;

  // Additional fields from nearby poles response
  final double? distance;
  final bool? isRestricted;

  Pole({
    required this.id,
    required this.poleName,
    required this.latitude,
    required this.longitude,
    required this.poleHeight,
    required this.restrictedRadius,
    required this.status,
    this.zoneId,
    this.landOwnerId,
    this.createdAt,
    this.distance,
    this.isRestricted,
  });

  factory Pole.fromJson(Map<String, dynamic> json) {
    return Pole(
      id: json['id'] as int,
      poleName: json['pole_name'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      poleHeight: (json['pole_height'] as num).toDouble(),
      restrictedRadius: (json['restricted_radius'] as num).toDouble(),
      status: json['status'] as String,
      zoneId: json['zone_id'] as int?,
      landOwnerId: json['land_owner_id'] as int?,
      createdAt: json['created_at'] as String?,
      distance: json['distance'] != null ? (json['distance'] as num).toDouble() : null,
      isRestricted: json['is_restricted'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'pole_name': poleName,
      'latitude': latitude,
      'longitude': longitude,
      'pole_height': poleHeight,
      'restricted_radius': restrictedRadius,
      'status': status,
      'zone_id': zoneId,
      'land_owner_id': landOwnerId,
      'created_at': createdAt,
      'distance': distance,
      'is_restricted': isRestricted,
    };
  }

  bool get isActive => status == 'active';
}
