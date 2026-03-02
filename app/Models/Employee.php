<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;
use App\Models\User;
use App\Models\Country;
use App\Models\Company;
use App\Models\Department;
use App\Models\Branch;
use App\Models\Team;
use App\Models\Designation;

class Employee extends Authenticatable
{
    use HasFactory, HasRoles;

    protected $fillable = [
        'first_name',
        'last_name',
        'gender',
        'employee_id',
        'nationality',
        'employee_status',
        'joining_date',
        'dob',
        'work_email',
        'contact_number',
        'company',
        'department',
        'branch',
        'team',
        'designation',
        'user_id',
        'image',
    ];

    // User relationship
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Country (nationality) relationship
    public function country()
    {
        return $this->belongsTo(Country::class, 'nationality');
    }

    // Company relationship
    public function company_data()
    {
        return $this->belongsTo(Company::class, 'company');
    }

    // Department relationship
    public function department_data()
    {
        return $this->belongsTo(Department::class, 'department');
    }

    // Branch relationship
    public function branch_data()
    {
        return $this->belongsTo(Branch::class, 'branch');
    }

    // Team relationship
    public function team_data()
    {
        return $this->belongsTo(Team::class, 'team');
    }

    // Designation relationship
    public function designation_data()
    {
        return $this->belongsTo(Designation::class, 'designation');
    }
}
