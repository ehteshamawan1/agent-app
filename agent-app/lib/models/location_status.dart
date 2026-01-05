import 'pole.dart';

enum LocationStatusType {
  green,
  red,
  gray,
}

class LocationStatus {
  final String status; // GREEN, RED, GRAY
  final String message;
  final bool inZone;
  final bool canMarket;
  final String? zoneName;
  final String? nearestPole;
  final double? distanceToPole;
  final List<Pole>? nearbyPoles;

  LocationStatus({
    required this.status,
    required this.message,
    required this.inZone,
    required this.canMarket,
    this.zoneName,
    this.nearestPole,
    this.distanceToPole,
    this.nearbyPoles,
  });

  factory LocationStatus.fromJson(Map<String, dynamic> json) {
    return LocationStatus(
      status: json['status'] as String,
      message: json['message'] as String,
      inZone: json['in_zone'] as bool? ?? false,
      canMarket: json['can_market'] as bool? ?? false,
      zoneName: json['zone_name'] as String?,
      nearestPole: json['nearest_pole'] as String?,
      distanceToPole: json['distance_to_pole'] != null
          ? (json['distance_to_pole'] as num).toDouble()
          : null,
      nearbyPoles: json['nearby_poles'] != null
          ? (json['nearby_poles'] as List)
              .map((pole) => Pole.fromJson(pole as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'message': message,
      'in_zone': inZone,
      'can_market': canMarket,
      'zone_name': zoneName,
      'nearest_pole': nearestPole,
      'distance_to_pole': distanceToPole,
      'nearby_poles': nearbyPoles?.map((pole) => pole.toJson()).toList(),
    };
  }

  LocationStatusType get statusType {
    switch (status.toUpperCase()) {
      case 'GREEN':
        return LocationStatusType.green;
      case 'RED':
        return LocationStatusType.red;
      case 'GRAY':
      default:
        return LocationStatusType.gray;
    }
  }

  bool get isGreen => status.toUpperCase() == 'GREEN';
  bool get isRed => status.toUpperCase() == 'RED';
  bool get isGray => status.toUpperCase() == 'GRAY';
}
