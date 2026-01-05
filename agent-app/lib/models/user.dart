class User {
  final int id;
  final String name;
  final String email;
  final String role;
  final int? zoneId;
  final String? mobile;
  final String status;
  final String? createdAt;
  final String? updatedAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.zoneId,
    this.mobile,
    required this.status,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      zoneId: json['zone_id'] as int?,
      mobile: json['mobile'] as String?,
      status: json['status'] as String,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'zone_id': zoneId,
      'mobile': mobile,
      'status': status,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }

  bool get isAgent => role == 'agent';
  bool get isAdmin => role == 'admin';
  bool get isSuperAdmin => role == 'super_admin';
}
