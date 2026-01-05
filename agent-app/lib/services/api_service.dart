import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // IMPORTANT: Update this to your backend URL
  // For local development: http://10.0.2.2:8000 (Android emulator)
  // For production: https://api.bsnsolutions.cloud
  static const String baseUrl = 'https://api.bsnsolutions.cloud/api';

  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;
  String? _googleMapsApiKey;

  // Get stored token
  Future<String?> getToken() async {
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    return _token;
  }

  // Save token
  Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  // Remove token
  Future<void> removeToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  // Get Google Maps API key (fetched from backend)
  Future<String?> getGoogleMapsApiKey() async {
    if (_googleMapsApiKey != null) return _googleMapsApiKey;

    final prefs = await SharedPreferences.getInstance();
    _googleMapsApiKey = prefs.getString('google_maps_api_key');

    // If not in cache, fetch from backend
    if (_googleMapsApiKey == null) {
      await fetchGoogleMapsApiKey();
    }

    return _googleMapsApiKey;
  }

  // Fetch Google Maps API key from backend
  Future<void> fetchGoogleMapsApiKey() async {
    try {
      final response = await get('/settings/google_maps_api_key');
      if (response['value'] != null) {
        _googleMapsApiKey = response['value'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('google_maps_api_key', _googleMapsApiKey!);
      }
    } catch (e) {
      print('Error fetching Google Maps API key: $e');
    }
  }

  // Generic GET request
  Future<dynamic> get(String endpoint) async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Generic POST request
  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    try {
      final token = await getToken();
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Generic PUT request
  Future<dynamic> put(String endpoint, Map<String, dynamic> data) async {
    try {
      final token = await getToken();
      final response = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Generic DELETE request
  Future<dynamic> delete(String endpoint) async {
    try {
      final token = await getToken();
      final response = await http.delete(
        Uri.parse('$baseUrl$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Handle API response
  dynamic _handleResponse(http.Response response) {
    final int statusCode = response.statusCode;
    final dynamic body = jsonDecode(response.body);

    if (statusCode >= 200 && statusCode < 300) {
      // Success
      return body;
    } else if (statusCode == 401) {
      // Unauthorized - token expired or invalid
      removeToken();
      throw Exception('Unauthorized. Please login again.');
    } else if (statusCode == 403) {
      // Forbidden - insufficient permissions
      throw Exception('Access forbidden.');
    } else if (statusCode == 422) {
      // Validation error
      final errors = body['errors'] ?? {};
      final firstError = errors.values.first;
      throw Exception(firstError is List ? firstError[0] : firstError);
    } else {
      // Other errors
      final message = body['message'] ?? 'An error occurred';
      throw Exception(message);
    }
  }
}
