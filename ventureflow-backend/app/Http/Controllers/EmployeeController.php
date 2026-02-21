<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;
use App\Models\Buyer;
use App\Models\BuyersCompanyOverview;
use App\Models\Employee;
use App\Models\Partner;
use App\Models\PartnersPartnerOverview;
use App\Models\SellersCompanyOverview;
use DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Exception;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Only System Admin and Staff can view employees
        if (!$request->user()->hasAnyRole(['System Admin', 'Staff'])) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        $search = $request->input('search', '');

        $employees = Employee::with([
            'country',
            'user',
            'company_data',
            'department_data',
            'branch_data',
            'team_data',
            'designation_data',
        ])
            ->when($search, function ($query, $search) {
                return $query->where(function ($query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->paginate(10);

        return response()->json([
            'data' => $employees->items(),
            'meta' => [
                'total' => $employees->total(),
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'per_page' => $employees->perPage(),
            ]
        ]);
    }


    /**
     * Fetch all employees without pagination.
     * IMPORTANT: This endpoint is used for "Assigned PIC" dropdown.
     * Only staff and admin users should appear — partners are strictly excluded.
     */
    public function fetchAllEmployees()
    {
        try {
            // Get all employees (these are staff created from Staff Management)
            $employees = Employee::with('country')->get()->map(function($emp) {
                $emp->full_name = trim(($emp->first_name ?? '') . ' ' . ($emp->last_name ?? ''));
                if (empty(trim($emp->full_name)) && $emp->user) {
                    $emp->full_name = $emp->user->name;
                }
                $emp->name = $emp->full_name;
                return $emp;
            });
            
            // Get user IDs that belong to employees
            $employeeUserIds = $employees->pluck('user_id')->filter()->toArray();

            // Get user IDs that belong to partners — these must be EXCLUDED
            $partnerUserIds = \App\Models\Partner::whereNotNull('user_id')
                ->pluck('user_id')
                ->toArray();

            // Combine all IDs to exclude from the "other users" query
            $excludedUserIds = array_merge($employeeUserIds, $partnerUserIds);
            
            // Get admin/system users who are NOT employees and NOT partners
            $otherUsers = User::whereNotIn('id', $excludedUserIds)->get();
            
            // Map users to employee-like structure for the frontend
            $mappedUsers = $otherUsers->map(function($user) {
                return (object)[
                    'id' => 'user_' . $user->id,
                    'user_id' => $user->id,
                    'first_name' => $user->name,
                    'last_name' => '',
                    'full_name' => $user->name,
                    'name' => $user->name,
                    'work_email' => $user->email,
                    'nationality' => null,
                ];
            });

            return response()->json($employees->concat($mappedUsers));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch employees',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            // Determine registration type (default to employee)
            $type = $request->input('type', 'employee');

            if ($type === 'partner') {
                // Partner Registration Logic
                $validated = $request->validate([
                    'partner_id' => 'required|string',
                    'reg_name' => 'required|string',
                    'login_email' => 'required|email',
                    'password' => 'nullable|string|min:6',
                    'hq_country' => 'nullable|string',
                ]);

                // 1. Create/Update User
                $userData = [
                    'name' => $validated['reg_name'],
                    'email' => $validated['login_email'],
                ];
                if (!empty($validated['password'])) {
                    $userData['password'] = Hash::make($validated['password']);
                }

                $user = User::updateOrCreate(
                    ['email' => $validated['login_email']],
                    $userData
                );

                // Assign Partner Role
                $role = Role::firstOrCreate(['name' => 'Partner']);
                $user->assignRole($role);

                // 2. Create/Update Partner Record
                $partner = null;
                $overview = null;
                $message = 'Partner created successfully';

                $existingId = $request->input('id');
                if ($existingId) {
                    $partner = Partner::find($existingId);
                    if ($partner) {
                        $overview = PartnersPartnerOverview::find($partner->partner_overview_id);
                        $message = 'Partner updated successfully';
                    }
                }

                // 2. Create/Update Partner Overview
                $overviewData = [
                    'reg_name' => $validated['reg_name'],
                    'hq_country' => $validated['hq_country'] ?? null,
                ];
                
                if ($overview) {
                    $overview->update($overviewData);
                } else {
                    $overview = PartnersPartnerOverview::create($overviewData);
                }

                // 3. Create/Update Partner Record
                $partnerData = [
                    'partner_id' => $validated['partner_id'],
                    'partner_overview_id' => $overview->id,
                    'user_id' => $user->id,
                ];
                
                if ($partner) {
                    $partner->update($partnerData);
                } else {
                    $partner = Partner::create($partnerData);
                }

                DB::commit();

                return response()->json([
                    'message' => $message,
                    'partner' => $partner,
                    'user' => $user,
                ], 201);

            } else {
                // Employee Registration Logic
                $validated = $request->validate([
                    'first_name' => 'required|string',
                    'last_name' => 'required|string',
                    'login_email' => 'required|email',
                    'work_email' => 'required|email',
                    'role' => 'required|string',
                    'employee_id' => 'required|string',
                    'id' => 'nullable|integer',
                    'gender' => 'nullable|string',
                    'nationality' => 'nullable|string',
                    'contact_number' => 'nullable|string',
                    'password' => 'nullable|string|min:6',
                    'designation' => 'nullable|string',
                    'department' => 'nullable|string',
                    'image' => 'nullable|image|max:1024',
                ]);

                $imagePath = null;
                if ($request->hasFile('image')) {
                    $imagePath = $request->file('image')->store('employees', 'public');
                }

                // Create/Update User
                $userData = [
                    'name' => $validated['first_name'] . ' ' . $validated['last_name'],
                    'email' => $validated['login_email'],
                ];

                if (!empty($validated['password'])) {
                    $userData['password'] = Hash::make($validated['password']);
                }

                $user = User::updateOrCreate(
                    ['email' => $validated['login_email']],
                    $userData
                );

                // Assign Role — System Admin and Staff can both assign roles
                if ($request->user() && $request->user()->hasAnyRole(['System Admin', 'Staff'])) {
                     $role = Role::where('name', $validated['role'])->first();
                     if ($role) {
                         $user->syncRoles([$role]);
                     }
                } elseif (!$user->roles()->exists()) {
                     $user->assignRole('Staff');
                }

                // Create/Update Employee Record
                $employeeData = [
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'employee_id' => $validated['employee_id'],
                    'work_email' => $validated['work_email'],
                    'user_id' => $user->id,
                    'gender' => $validated['gender'] ?? null,
                    'nationality' => $validated['nationality'] ?? null,
                    'contact_number' => $validated['contact_number'] ?? null,
                ];

                if ($imagePath) {
                    $employeeData['image'] = $imagePath;
                }

                if (!empty($validated['id'])) {
                    $employee = Employee::findOrFail($validated['id']);
                    $employee->update($employeeData);
                    $message = 'Employee updated successfully';
                } else {
                    $employee = Employee::create($employeeData);
                    $message = 'Employee created successfully';
                }

                DB::commit();

                return response()->json([
                    'message' => $message,
                    'employee' => $employee,
                    'user' => $user,
                ], 201);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Employee Save Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while saving',
                'error' => $e->getMessage(),
            ], 500);
        }
    }





    public function show(Request $request, string $id)
    {
        try {
            $type = $request->query('type');
            
            if ($type === 'partner') {
                $partner = Partner::with(['user.roles', 'partnerOverview'])->findOrFail($id);
                // Map Partner to a structure CreateEmployee.tsx can understand
                $data = [
                    'id' => $partner->id,
                    'is_partner' => true,
                    'reg_name' => $partner->partnerOverview->reg_name ?? '',
                    'partner_id' => $partner->partner_id,
                    'nationality' => $partner->partnerOverview->hq_country ?? null,
                    'user' => [
                        'email' => $partner->user->email ?? '',
                    ],
                    'image' => $partner->image, // Assuming Partner might have image later
                    'role' => ($partner->user && $partner->user->roles) ? $partner->user->roles->pluck('name')->first() : 'Partner',
                ];
                return response()->json($data);
            }

            $employee = Employee::with([
                'country',
                'user.roles',
                'company_data',
                'department_data',
                'branch_data',
                'team_data',
                'designation_data',
            ])->find($id);

            if (!$employee) {
                // If not found as employee, try as partner as a fallback
                $partner = Partner::with(['user.roles', 'partnerOverview'])->find($id);
                if ($partner) {
                     $data = [
                        'id' => $partner->id,
                        'is_partner' => true,
                        'reg_name' => $partner->partnerOverview->reg_name ?? '',
                        'partner_id' => $partner->partner_id,
                        'nationality' => $partner->partnerOverview->hq_country ?? null,
                        'user' => [
                            'email' => $partner->user->email ?? '',
                        ],
                        'image' => $partner->image,
                        'role' => ($partner->user && $partner->user->roles) ? $partner->user->roles->pluck('name')->first() : 'Partner',
                    ];
                    return response()->json($data);
                }
                return response()->json(['message' => 'User not found'], 404);
            }

            $employee->role = ($employee->user && $employee->user->roles) ? $employee->user->roles->pluck('name')->first() : null;

            return response()->json($employee);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error retrieving user details',
                'error' => $e->getMessage(),
            ], 500);
        }
    }





    public function update(Request $request, string $id)
    {
        //
    }


    public function destroy(Request $request)
    {
        try {
            $idsToDelete = $request->input('ids');

            if (empty($idsToDelete)) {
                return response()->json(['message' => 'No Employee IDs provided for deletion.'], 400);
            }

            $idsToDelete = is_array($idsToDelete) ? $idsToDelete : [$idsToDelete];

            $deletedCount = 0;

            DB::transaction(function () use ($idsToDelete, &$deletedCount) {
                SellersCompanyOverview::whereIn('incharge_name', $idsToDelete)
                    ->update(['incharge_name' => null]);

                BuyersCompanyOverview::whereIn('incharge_name', $idsToDelete)
                    ->update(['incharge_name' => null]);

                PartnersPartnerOverview::whereIn('our_contact_person', $idsToDelete)
                    ->update(['our_contact_person' => null]);

                $employees = Employee::with('user')->whereIn('id', $idsToDelete)->get();

                $employees->each(function ($employee) {
                    $employee->delete();
                    $employee->user?->delete();
                });

                $deletedCount = $employees->count();
            });

            if ($deletedCount > 0) {
                $message = $deletedCount === 1
                    ? 'Employee and related user deleted successfully.'
                    : "$deletedCount employees and related users deleted successfully.";

                return response()->json(['message' => $message], 200);
            }

            return response()->json(['message' => 'No employees found with the provided IDs.'], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting employee(s): ' . $e->getMessage(), [
                'exception' => $e,
                'ids_provided' => $request->input('ids'),
            ]);

            return response()->json([
                'message' => 'Failed to delete employee(s).',
                'error' => $e->getMessage(),
            ], 500);
        }
    }




    public function assigned_projects(Request $request, $employeeId)
    {
        $perPage = $request->input('per_page', 10);
        $buyers = Buyer::with([
            'companyOverview',
            'targetPreference',
            'financialDetails',
            'partnershipDetails',
            'teaserCenter',
        ])
            ->whereHas('companyOverview', function ($query) use ($employeeId) {
                $query->where('incharge_name', $employeeId);
            })
            ->paginate($perPage);

        return response()->json([
            'data' => $buyers->items(),
            'meta' => [
                'total' => $buyers->total(),
                'current_page' => $buyers->currentPage(),
                'last_page' => $buyers->lastPage(),
                'per_page' => $buyers->perPage(),
            ]
        ]);
    }
}
