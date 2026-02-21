<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // create roles and assign created permissions

        // this can be done as separate statements
        $roleAdmin = Role::firstOrCreate(['name' => 'System Admin']);
        $roleStaff = Role::firstOrCreate(['name' => 'Staff']);
        
        // You can add permissions here later if needed
        // $permission = Permission::create(['name' => 'edit articles']);
        // $roleAdmin->givePermissionTo($permission);
    }
}
