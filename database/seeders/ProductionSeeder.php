<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 *
 * Run this seeder ONCE on first production deployment:
 *   php artisan db:seed --class=ProductionSeeder
 */

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Seed Roles ──────────────────────────────────────────────────────
        $this->call(RolesTableSeeder::class);

        // ── 2. Seed reference data ─────────────────────────────────────────────
        $this->call([
            CountrySeeder::class,
            // Add more reference seeders here as needed
        ]);

        // ── 3. Create System Admin account ─────────────────────────────────────
        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info('  VentureFlow — Production Setup');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info('');
        $this->command->info('Creating the System Administrator account.');
        $this->command->warn('These credentials will be used to log in to the application for the first time.');
        $this->command->info('');

        $adminName  = $this->command->ask('Admin full name', 'System Admin');
        $adminEmail = $this->command->ask('Admin email address');

        while (!filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
            $this->command->error('Please enter a valid email address.');
            $adminEmail = $this->command->ask('Admin email address');
        }

        $adminPassword = $this->command->secret('Admin password (min 8 characters)');

        while (strlen($adminPassword) < 8) {
            $this->command->error('Password must be at least 8 characters.');
            $adminPassword = $this->command->secret('Admin password (min 8 characters)');
        }

        $confirmPassword = $this->command->secret('Confirm admin password');

        while ($adminPassword !== $confirmPassword) {
            $this->command->error('Passwords do not match. Please try again.');
            $adminPassword   = $this->command->secret('Admin password (min 8 characters)');
            $confirmPassword = $this->command->secret('Confirm admin password');
        }

        $admin = User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name'                 => $adminName,
                'password'             => Hash::make($adminPassword),
                'must_change_password' => false,
                'is_active'            => true,
                'email_verified_at'    => now(),
            ]
        );

        $admin->syncRoles(['System Admin']);

        $this->command->info('');
        $this->command->info("✅ System Admin created: {$adminEmail}");
        $this->command->info('');
        $this->command->warn('IMPORTANT: Keep these credentials secure. Do NOT commit them to version control.');
        $this->command->info('');
        $this->command->info('Next steps:');
        $this->command->info('  php artisan storage:link');
        $this->command->info('  php artisan config:cache');
        $this->command->info('  php artisan route:cache');
        $this->command->info('');
    }
}
