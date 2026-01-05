<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'google_maps_api_key',
                'value' => '', // To be set by admin via settings page
                'description' => 'Google Maps API Key (used for Maps JavaScript API, Android SDK, and Elevation API)',
            ],
            [
                'key' => 'app_name',
                'value' => 'Tower Marketing Tracker',
                'description' => 'Application name displayed in admin panel and mobile app',
            ],
            [
                'key' => 'support_email',
                'value' => 'support@example.com',
                'description' => 'Support contact email',
            ],
            [
                'key' => 'support_phone',
                'value' => '',
                'description' => 'Support contact phone number',
            ],
        ];

        foreach ($settings as $setting) {
            \DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
