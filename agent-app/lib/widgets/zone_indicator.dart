import 'package:flutter/material.dart';

class ZoneIndicator extends StatelessWidget {
  final String zoneName;
  final bool isInZone;

  const ZoneIndicator({
    super.key,
    required this.zoneName,
    this.isInZone = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isInZone ? Icons.location_on : Icons.location_off,
            color: isInZone ? Colors.blue : Colors.grey,
            size: 20,
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              zoneName,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isInZone ? Colors.blue[900] : Colors.grey,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
