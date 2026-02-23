<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 *
 * Usage: php artisan user:reset-password user@example.com
 *
 * This command is for server-side admin use only — typically used when the
 * System Administrator has lost access and cannot use the web UI to reset.
 */

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetUserPassword extends Command
{
    protected $signature   = 'user:reset-password {email : The email address of the user}';
    protected $description = 'Reset a user\'s password from the server CLI (admin use only)';

    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("No user found with email: {$email}");
            return Command::FAILURE;
        }

        $this->info("Resetting password for: {$user->name} ({$user->email})");
        $this->info("Role: " . ($user->getRoleNames()->first() ?? 'none'));
        $this->newLine();

        $password = $this->secret('New password (min 8 characters)');

        while (strlen($password) < 8) {
            $this->error('Password must be at least 8 characters.');
            $password = $this->secret('New password (min 8 characters)');
        }

        $confirm = $this->secret('Confirm new password');

        while ($password !== $confirm) {
            $this->error('Passwords do not match. Please try again.');
            $password = $this->secret('New password (min 8 characters)');
            $confirm  = $this->secret('Confirm new password');
        }

        $user->update([
            'password'             => Hash::make($password),
            'must_change_password' => false, // CLI reset = intentional, no forced change
        ]);

        // Revoke all existing Sanctum tokens to force re-login
        $user->tokens()->delete();

        $this->newLine();
        $this->info("✅ Password successfully reset for {$user->email}");
        $this->info("   All existing sessions have been revoked.");
        $this->newLine();

        return Command::SUCCESS;
    }
}
