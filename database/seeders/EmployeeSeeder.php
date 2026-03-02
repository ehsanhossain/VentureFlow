<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class EmployeeSeeder extends Seeder
{
    public function run()
    {
        // Ensure the 'employee' role exists
        $role = Role::firstOrCreate(['name' => 'employee']);

        for ($i = 1; $i <= 20; $i++) {
            $firstName = fake()->firstName;
            $lastName = fake()->lastName;
            $email = strtolower($firstName . '.' . $lastName . $i . '@example.com');

            // Create user
            $user = User::create([
                'name' => "$firstName $lastName",
                'email' => $email,
                'password' => Hash::make('employee123'),
            ]);

            // Assign role to user
            $user->assignRole($role);

            // Create employee
            Employee::create([
                'image' => null,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'gender' => fake()->randomElement(['male', 'female', 'other']),
                'employee_id' => strtoupper(Str::random(6)),
                'nationality' => 1,
                'employee_status' => fake()->randomElement(['active', 'inactive']),
                'joining_date' => fake()->date(),
                'dob' => fake()->date('Y-m-d', '-20 years'),
                'work_email' => $email,
                'contact_number' => fake()->phoneNumber,
                'company' => fake()->company,
                'department' => fake()->randomElement(['HR', 'Tech', 'Sales', 'Finance']),
                'branch' => fake()->city,
                'team' => fake()->word,
                'designation' => fake()->jobTitle,
                'user_id' => $user->id,
            ]);
        }
    }
}
