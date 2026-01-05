# Agent App - Tower/Pole Marketing Map System

Zone-aware mobile application for field agents to check if marketing is allowed at their current GPS location.

## Features

- **Zone-Based Access Control**: Agents are limited to their assigned geographic zones
- **Real-Time Location Tracking**: GPS tracking with 10-second auto-refresh
- **Three-State Status System**:
  - 🟢 **GREEN**: Marketing allowed (in zone, outside pole radius)
  - 🔴 **RED**: Marketing not allowed (in zone, inside pole radius)
  - ⚪ **GRAY**: Outside assigned zone
- **Google Maps Integration**: Shows poles, restricted radius circles, and zone boundaries
- **Offline Support**: Caches zone data for offline zone boundary checks
- **Dynamic API Key**: Fetches Google Maps API key from backend (no hardcoding)

## Prerequisites

- Flutter SDK 3.0.0 or higher
- Android Studio or VS Code with Flutter extension
- Android device or emulator (Android 8.0+ / API 21+)
- Backend API running (Laravel backend from this project)

## Installation & Setup

### 1. Install Dependencies

```bash
cd agent-app
flutter pub get
```

### 2. Configure Backend URL

**IMPORTANT**: Update the backend API URL in `lib/services/api_service.dart`:

```dart
// For local development on Android emulator:
static const String baseUrl = 'http://10.0.2.2:8000/api';

// For physical device (replace with your computer's IP):
// static const String baseUrl = 'http://192.168.1.100:8000/api';

// For production:
// static const String baseUrl = 'https://your-domain.com/api';
```

**Network Configuration:**
- **Android Emulator**: Use `10.0.2.2` (maps to `localhost` on host machine)
- **Physical Device**: Use your computer's local IP address (find via `ipconfig` on Windows or `ifconfig` on Mac/Linux)
- **Production**: Use your deployed backend URL

### 3. Run the App

**On Android Emulator:**
```bash
flutter run
```

**On Physical Device:**
1. Enable Developer Mode and USB Debugging on your Android device
2. Connect device via USB
3. Run: `flutter run`

**Check connected devices:**
```bash
flutter devices
```

## Test Credentials

The app includes test agent accounts (configured in backend seeders):

| Email | Password | Zone |
|-------|----------|------|
| agent1@test.com | password123 | Test Zone 1 (Lahore North) |
| agent2@test.com | password123 | Test Zone 2 (Karachi East) |

**Note**: Only users with `agent` role can access the mobile app. Admins and Super Admins are prevented from logging in.

## Building APK for Production

### Debug APK (for testing)
```bash
flutter build apk --debug
```
Output: `build/app/outputs/flutter-apk/app-debug.apk`

### Release APK (for production)
```bash
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

**For Signed Release APK:**
1. Create a keystore file
2. Configure signing in `android/app/build.gradle`
3. Build: `flutter build apk --release`

See: [Flutter Deployment Documentation](https://docs.flutter.dev/deployment/android)

## App Architecture

### Folder Structure
```
lib/
├── models/           # Data models (User, Zone, Pole, LocationStatus)
├── services/         # API and business logic services
│   ├── api_service.dart       # HTTP client and API key management
│   ├── auth_service.dart      # Authentication
│   ├── zone_service.dart      # Zone data and point-in-polygon
│   ├── location_service.dart  # GPS and permissions
│   └── map_service.dart       # Map markers and location check
├── providers/        # State management (Provider pattern)
│   ├── auth_provider.dart     # User authentication state
│   ├── zone_provider.dart     # Zone data state
│   └── location_provider.dart # GPS and location status state
├── screens/          # App screens
│   ├── splash_screen.dart     # Initial loading screen
│   ├── login_screen.dart      # Agent login
│   └── map_screen.dart        # Main map with status indicator
├── widgets/          # Reusable UI components
│   ├── status_indicator.dart  # GREEN/RED/GRAY indicator
│   └── zone_indicator.dart    # Zone name display
└── main.dart         # App entry point
```

### Key Technologies
- **State Management**: Provider
- **HTTP Client**: http package
- **Local Storage**: shared_preferences
- **Maps**: google_maps_flutter
- **Location**: geolocator, permission_handler

## How It Works

1. **Initialization**:
   - Splash screen fetches Google Maps API key from backend
   - Checks if user is already logged in (token in SharedPreferences)
   - Navigates to Map or Login screen

2. **Authentication**:
   - Agent logs in with email/password
   - Backend returns Sanctum token
   - Token stored locally for auto-login
   - Only `agent` role users can access app

3. **Zone Loading**:
   - Fetches agent's assigned zone from backend (`GET /api/agent/zone`)
   - Caches zone data locally (SharedPreferences)
   - Parses zone boundary coordinates
   - Displays zone boundary as polygon on map

4. **Location Tracking**:
   - Requests GPS permissions
   - Gets current location
   - Auto-refreshes every 10 seconds
   - Checks accuracy (shows warning if > 50m)

5. **Status Check**:
   - Sends current lat/lng to backend (`POST /api/check-location`)
   - Backend checks:
     1. Is agent in assigned zone? → No: return GRAY
     2. Is agent inside any pole's restricted radius? → Yes: return RED
     3. Otherwise: return GREEN
   - Frontend displays status with appropriate color

6. **Map Display**:
   - Shows current location marker (blue)
   - Shows pole markers (red/orange)
   - Shows restricted radius circles (toggle on/off)
   - Shows zone boundary polygon (toggle on/off)
   - Info windows on pole marker tap

## Permissions Required

The app requests the following Android permissions:

- **Internet**: For API communication
- **Access Fine Location**: For high-accuracy GPS
- **Access Coarse Location**: Fallback for lower accuracy
- **Access Background Location**: For continued tracking (Android 10+)

These are configured in `android/app/src/main/AndroidManifest.xml`.

## Features Overview

### Status Indicator
- Large visual indicator at top of screen
- Updates automatically as agent moves
- Shows:
  - Status (GREEN/RED/GRAY)
  - Message explaining status
  - Nearest pole name (if RED)
  - Distance to nearest pole (if RED)

### Zone Indicator
- Displays assigned zone name
- Shows location icon (on/off based on zone status)
- Helps agent quickly identify their zone

### GPS Accuracy Warning
- Appears if GPS accuracy > 50 meters
- Orange banner with warning icon
- Shows actual accuracy value
- Status still displays (per requirements)

### Map Controls
- **Refresh Button**: Manual location refresh
- **Toggle Circles**: Show/hide restricted radius circles
- **Toggle Boundary**: Show/hide zone boundary polygon
- **Logout Button**: Log out and return to login screen

### User Info Panel
- Shows agent name
- Shows GPS accuracy level (Excellent/Good/Fair/Poor)
- Shows accuracy in meters

## Troubleshooting

### App won't connect to backend
- Check backend URL in `api_service.dart`
- Ensure backend is running
- For emulator: Use `10.0.2.2:8000`
- For physical device: Use your computer's local IP

### Location not updating
- Check GPS permissions are granted
- Enable location services on device
- Check device has good GPS signal
- Try physical device (emulator GPS can be unreliable)

### Google Maps not loading
- Ensure Google Maps API key is configured in backend
- Check backend endpoint: `GET /api/settings/google_maps_api_key`
- Verify Google Maps SDK for Android is enabled in Google Cloud Console

### "Only agents can access" error
- Ensure you're logging in with agent account
- Check user role in database (`role = 'agent'`)
- Admins/Super Admins cannot use mobile app

## Development vs Production

### Development Mode
- Backend URL: `http://10.0.2.2:8000/api` (emulator)
- Test credentials displayed on login screen
- Debug APK with debug signing

### Production Mode
- Backend URL: Your production domain
- Remove test credentials from login screen
- Signed release APK with proper keystore
- Consider removing debug logs

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Agent authentication |
| `/auth/logout` | POST | Logout |
| `/auth/me` | GET | Get current user data |
| `/settings/google_maps_api_key` | GET | Fetch API key |
| `/agent/zone` | GET | Get agent's assigned zone |
| `/agent/poles` | GET | Get poles in agent's zone |
| `/check-location` | POST | Check location status (GREEN/RED/GRAY) |

## Business Rules Implemented

1. **Zone Restriction**: Agent location checked only within assigned zone
2. **Outside Zone**: Show GRAY status if outside zone boundary
3. **Priority RED**: If inside ANY pole's restricted radius, show RED
4. **GPS Accuracy**: Show warning if > 50m, but still display status
5. **Auto-Refresh**: Location updates every 10 seconds
6. **Radius Range**: Poles have 50m - 5000m restricted radius
7. **View-Only**: Agents cannot add/edit/delete data

## Next Steps (Phase 6 - Testing)

Before this app can be fully tested:
1. Backend database must be set up (MySQL)
2. Backend migrations must be run
3. Backend seeders must be run (creates test users and zones)
4. Backend server must be running
5. Google Maps API key must be configured in backend settings

## Support

For issues or questions:
- Check backend API is running
- Verify test data exists in database
- Check network connectivity
- Review error messages in app

## License

Proprietary - Tower/Pole Marketing Map System
