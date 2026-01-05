import 'package:flutter/material.dart';
import '../models/location_status.dart';

class StatusIndicator extends StatelessWidget {
  final LocationStatus? status;
  final bool isLoading;

  const StatusIndicator({
    super.key,
    required this.status,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return _buildLoadingIndicator();
    }

    if (status == null) {
      return _buildGrayIndicator('Checking location...');
    }

    // Determine color and icon based on status
    Color backgroundColor;
    Color textColor;
    IconData icon;

    if (status!.isGreen) {
      backgroundColor = Colors.green;
      textColor = Colors.white;
      icon = Icons.check_circle;
    } else if (status!.isRed) {
      backgroundColor = Colors.red;
      textColor = Colors.white;
      icon = Icons.cancel;
    } else {
      // GRAY - outside zone
      backgroundColor = Colors.grey;
      textColor = Colors.white;
      icon = Icons.info;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: backgroundColor,
        boxShadow: [
          BoxShadow(
            color: backgroundColor.withOpacity(0.5),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Icon(
              icon,
              size: 48,
              color: textColor,
            ),
            const SizedBox(height: 12),
            // Status text
            Text(
              status!.status,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
            const SizedBox(height: 8),
            // Message
            Text(
              status!.message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: textColor,
              ),
            ),
            // Additional info for RED status
            if (status!.isRed && status!.nearestPole != null) ...[
              const SizedBox(height: 8),
              Text(
                'Nearest Pole: ${status!.nearestPole}',
                style: TextStyle(
                  fontSize: 14,
                  color: textColor.withOpacity(0.9),
                ),
              ),
              if (status!.distanceToPole != null)
                Text(
                  'Distance: ${status!.distanceToPole!.toStringAsFixed(1)}m',
                  style: TextStyle(
                    fontSize: 14,
                    color: textColor.withOpacity(0.9),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.blue,
      ),
      child: const SafeArea(
        bottom: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
            SizedBox(height: 12),
            Text(
              'Checking Location...',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrayIndicator(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.grey,
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.info,
              size: 48,
              color: Colors.white,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
