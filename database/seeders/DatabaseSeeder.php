<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Create admin user for testing
        $admin = User::firstOrCreate(
            ['email' => 'admin@ventureflow.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@ventureflow.com',
                'password' => Hash::make('admin123'),
            ]
        );

        $this->call(RolesTableSeeder::class);
        $admin->assignRole('System Admin');
        
        // Create staff user for testing
        $staff = User::firstOrCreate(
            ['email' => 'staff@ventureflow.com'],
            [
                'name' => 'Staff User',
                'email' => 'staff@ventureflow.com',
                'password' => Hash::make('staff123'),
            ]
        );
        $staff->assignRole('Staff');

        $this->call(CountrySeeder::class);
        // $this->call(EmployeeSeeder::class);
        $this->call(IndustrySeeder::class);
        $this->call(SubIndustrySeeder::class);
        $this->call(CompanySeeder::class);
        $this->call(DesignationSeeder::class);
        $this->call(BranchSeeder::class);
        $this->call(TeamSeeder::class);
        $this->call(DepartmentSeeder::class);
    }
}
