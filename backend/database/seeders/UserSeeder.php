<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@test.com',
                'password' => bcrypt('password123'), // Change after first login
                'role' => 'super_admin',
                'zone_id' => null, // Super admin has no zone - can access all
                'mobile' => '03001234567',
                'status' => 'active',
                'is_super_admin' => true,
            ],
            [
                'name' => 'Admin Zone 1',
                'email' => 'admin1@test.com',
                'password' => bcrypt('password123'), // Change after first login
                'role' => 'admin',
                'zone_id' => 1, // Lahore North
                'mobile' => '03001234568',
                'status' => 'active',
                'is_super_admin' => false,
            ],
            [
                'name' => 'Admin Zone 2',
                'email' => 'admin2@test.com',
                'password' => bcrypt('password123'), // Change after first login
                'role' => 'admin',
                'zone_id' => 2, // Karachi East
                'mobile' => '03001234569',
                'status' => 'active',
                'is_super_admin' => false,
            ],
            [
                'name' => 'Agent Zone 1',
                'email' => 'agent1@test.com',
                'password' => bcrypt('password123'), // Change after first login
                'role' => 'agent',
                'zone_id' => 1, // Lahore North
                'mobile' => '03001234570',
                'status' => 'active',
                'is_super_admin' => false,
            ],
            [
                'name' => 'Agent Zone 2',
                'email' => 'agent2@test.com',
                'password' => bcrypt('password123'), // Change after first login
                'role' => 'agent',
                'zone_id' => 2, // Karachi East
                'mobile' => '03001234571',
                'status' => 'active',
                'is_super_admin' => false,
            ],
        ];

        foreach ($users as $user) {
            \DB::table('users')->insert($user);
        }
    }
}
