<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ZoneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Note: created_by will be set to super admin user (id=1) after users are seeded
        // For now, we'll insert zones first and update created_by later

        $zones = [
            [
                'zone_name' => 'Lahore North',
                'zone_boundary' => json_encode([
                    ['lat' => 31.5804, 'lng' => 74.3287],
                    ['lat' => 31.5804, 'lng' => 74.3687],
                    ['lat' => 31.5204, 'lng' => 74.3687],
                    ['lat' => 31.5204, 'lng' => 74.3287],
                ]),
                'description' => 'Test zone covering northern Lahore area',
                'status' => 'active',
                'created_by' => 1, // Will be super admin
            ],
            [
                'zone_name' => 'Karachi East',
                'zone_boundary' => json_encode([
                    ['lat' => 24.9056, 'lng' => 67.0822],
                    ['lat' => 24.9056, 'lng' => 67.1222],
                    ['lat' => 24.8656, 'lng' => 67.1222],
                    ['lat' => 24.8656, 'lng' => 67.0822],
                ]),
                'description' => 'Test zone covering eastern Karachi area',
                'status' => 'active',
                'created_by' => 1, // Will be super admin
            ],
        ];

        foreach ($zones as $zone) {
            \DB::table('zones')->insert($zone);
        }
    }
}
