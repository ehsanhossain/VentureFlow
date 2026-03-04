<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;
use App\Models\Buyer;
use App\Models\BuyersCompanyOverview;
use App\Models\Deal;
use App\Models\Employee;
use App\Models\Partner;
use App\Models\PartnersPartnerOverview;
use App\Models\Seller;
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
            'user.roles',
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

            // Expose is_active on the user object for the admin panel
            if ($employee->user) {
                $employee->user->makeVisible('is_active');
            }

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


    /**
     * Check the impact of deleting one or more employees.
     * Returns a summary of where each employee is referenced (deals, investors, targets).
     */
    public function deletionImpact(Request $request)
    {
        try {
            $ids = $request->input('ids', []);
            $ids = is_array($ids) ? $ids : [$ids];

            if (empty($ids)) {
                return response()->json(['impacts' => []], 200);
            }

            // Check if any of the IDs is the current user
            $currentEmployee = Employee::where('user_id', $request->user()->id)->first();
            $isSelfIncluded = $currentEmployee && in_array($currentEmployee->id, $ids);

            $impacts = [];

            foreach ($ids as $empId) {
                $employee = Employee::with('user')->find($empId);
                if (!$employee) continue;

                $userId = $employee->user_id;
                $empName = trim(($employee->first_name ?? '') . ' ' . ($employee->last_name ?? ''));
                if (empty($empName) && $employee->user) {
                    $empName = $employee->user->name;
                }

                // Find deals where this employee is PIC (pic_user_id)
                $dealsPic = Deal::where('pic_user_id', $userId)
                    ->select('id', 'name')
                    ->get()
                    ->toArray();

                // Find deals where this employee is in internal_pic JSON
                $dealsInternalPic = Deal::whereNotNull('internal_pic')
                    ->get()
                    ->filter(function ($deal) use ($empId) {
                        $pics = is_array($deal->internal_pic) ? $deal->internal_pic : json_decode($deal->internal_pic, true);
                        if (!is_array($pics)) return false;
                        foreach ($pics as $pic) {
                            if (isset($pic['id']) && $pic['id'] == $empId) return true;
                        }
                        return false;
                    })
                    ->map(fn($d) => ['id' => $d->id, 'name' => $d->name])
                    ->values()
                    ->toArray();

                // Find investor profiles (BuyersCompanyOverview) where this employee is internal_pic
                $investorProfiles = BuyersCompanyOverview::whereNotNull('internal_pic')
                    ->get()
                    ->filter(function ($overview) use ($empId) {
                        $pics = is_array($overview->internal_pic) ? $overview->internal_pic : json_decode($overview->internal_pic, true);
                        if (!is_array($pics)) return false;
                        foreach ($pics as $pic) {
                            if (isset($pic['id']) && $pic['id'] == $empId) return true;
                        }
                        return false;
                    })
                    ->map(fn($o) => ['id' => $o->id, 'name' => $o->reg_name ?? 'Unknown'])
                    ->values()
                    ->toArray();

                // Find target profiles (SellersCompanyOverview) where this employee is internal_pic
                $targetProfiles = SellersCompanyOverview::whereNotNull('internal_pic')
                    ->get()
                    ->filter(function ($overview) use ($empId) {
                        $pics = is_array($overview->internal_pic) ? $overview->internal_pic : json_decode($overview->internal_pic, true);
                        if (!is_array($pics)) return false;
                        foreach ($pics as $pic) {
                            if (isset($pic['id']) && $pic['id'] == $empId) return true;
                        }
                        return false;
                    })
                    ->map(fn($o) => ['id' => $o->id, 'name' => $o->reg_name ?? 'Unknown'])
                    ->values()
                    ->toArray();

                // Find investor/target profiles where this employee is incharge_name
                $investorIncharge = BuyersCompanyOverview::where('incharge_name', $empId)
                    ->select('id', 'reg_name as name')
                    ->get()
                    ->toArray();

                $targetIncharge = SellersCompanyOverview::where('incharge_name', $empId)
                    ->select('id', 'reg_name as name')
                    ->get()
                    ->toArray();

                $impacts[] = [
                    'employee_id' => $empId,
                    'employee_name' => $empName,
                    'is_self' => $currentEmployee && $currentEmployee->id == $empId,
                    'deals_as_pic' => $dealsPic,
                    'deals_as_internal_pic' => $dealsInternalPic,
                    'investor_profiles' => array_merge($investorProfiles, $investorIncharge),
                    'target_profiles' => array_merge($targetProfiles, $targetIncharge),
                ];
            }

            return response()->json([
                'impacts' => $impacts,
                'is_self_included' => $isSelfIncluded,
                'total_employees' => count($impacts),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Deletion impact check failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to check deletion impact',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function destroy(Request $request)
    {
        try {
            $idsToDelete = $request->input('ids');

            if (empty($idsToDelete)) {
                return response()->json(['message' => 'No Employee IDs provided for deletion.'], 400);
            }

            $idsToDelete = is_array($idsToDelete) ? $idsToDelete : [$idsToDelete];

            // Self-deletion prevention
            $currentEmployee = Employee::where('user_id', $request->user()->id)->first();
            if ($currentEmployee && in_array($currentEmployee->id, $idsToDelete)) {
                return response()->json(['message' => 'You cannot delete your own account.'], 403);
            }

            $deletedCount = 0;

            DB::transaction(function () use ($idsToDelete, &$deletedCount) {
                // Clean up incharge_name references
                SellersCompanyOverview::whereIn('incharge_name', $idsToDelete)
                    ->update(['incharge_name' => null]);

                BuyersCompanyOverview::whereIn('incharge_name', $idsToDelete)
                    ->update(['incharge_name' => null]);

                PartnersPartnerOverview::whereIn('our_contact_person', $idsToDelete)
                    ->update(['our_contact_person' => null]);

                $employees = Employee::with('user')->whereIn('id', $idsToDelete)->get();
                $userIds = $employees->pluck('user_id')->filter()->toArray();

                // Clean up Deal PIC references
                if (!empty($userIds)) {
                    Deal::whereIn('pic_user_id', $userIds)->update(['pic_user_id' => null]);
                }

                // Clean up internal_pic JSON in Deals
                $dealsWithPic = Deal::whereNotNull('internal_pic')->get();
                foreach ($dealsWithPic as $deal) {
                    $pics = is_array($deal->internal_pic) ? $deal->internal_pic : json_decode($deal->internal_pic, true);
                    if (!is_array($pics)) continue;
                    $filtered = array_values(array_filter($pics, function ($pic) use ($idsToDelete) {
                        return !isset($pic['id']) || !in_array($pic['id'], $idsToDelete);
                    }));
                    if (count($filtered) !== count($pics)) {
                        $deal->update(['internal_pic' => $filtered]);
                    }
                }

                // Clean up internal_pic JSON in Investor overviews
                $investorOverviews = BuyersCompanyOverview::whereNotNull('internal_pic')->get();
                foreach ($investorOverviews as $overview) {
                    $pics = is_array($overview->internal_pic) ? $overview->internal_pic : json_decode($overview->internal_pic, true);
                    if (!is_array($pics)) continue;
                    $filtered = array_values(array_filter($pics, function ($pic) use ($idsToDelete) {
                        return !isset($pic['id']) || !in_array($pic['id'], $idsToDelete);
                    }));
                    if (count($filtered) !== count($pics)) {
                        $overview->update(['internal_pic' => $filtered]);
                    }
                }

                // Clean up internal_pic JSON in Target overviews
                $targetOverviews = SellersCompanyOverview::whereNotNull('internal_pic')->get();
                foreach ($targetOverviews as $overview) {
                    $pics = is_array($overview->internal_pic) ? $overview->internal_pic : json_decode($overview->internal_pic, true);
                    if (!is_array($pics)) continue;
                    $filtered = array_values(array_filter($pics, function ($pic) use ($idsToDelete) {
                        return !isset($pic['id']) || !in_array($pic['id'], $idsToDelete);
                    }));
                    if (count($filtered) !== count($pics)) {
                        $overview->update(['internal_pic' => $filtered]);
                    }
                }

                // Delete Employee + User records
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

    /**
     * Upload or replace the avatar for a specific employee.
     * Route: POST /api/employees/{id}/avatar
     */
    public function uploadAvatar(Request $request, string $id)
    {
        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        $employee = Employee::findOrFail($id);
        $imagePath = $request->file('image')->store('employees', 'public');
        $employee->update(['image' => $imagePath]);

        return response()->json([
            'message'    => 'Avatar updated successfully.',
            'image_path' => $imagePath,
            'image_url'  => url('/api/files/' . $imagePath),
        ]);
    }
}
