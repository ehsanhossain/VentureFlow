<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

use App\Http\Controllers\ApiController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\ImportTemplateController;
use App\Http\Controllers\TargetController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\PartnerController;
use App\Http\Controllers\InvestorController;
use App\Http\Controllers\IndustryController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PipelineStageController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserTablePreferenceController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\FileServeController;
use App\Http\Controllers\DriveController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;

// ─────────────────────────────────────────────────────────────────────────────
// Public routes (no auth required)
// ─────────────────────────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);
Route::get('/files/{path}', [FileServeController::class, 'serve'])->where('path', '.*');
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
Route::post('/reset-password', [NewPasswordController::class, 'store']);
Route::get('/deals/seller', [ApiController::class, 'getSellerDealInfo']);
Route::post('/ai/extract', [\App\Http\Controllers\AIController::class, 'extract']);

// Flowdrive — Public shared links (no auth required)
Route::prefix('drive/shared')->group(function () {
    Route::get('/{token}',          [DriveController::class, 'accessShared']);
    Route::post('/{token}/verify',  [DriveController::class, 'verifySharePassword']);
    Route::get('/{token}/download', [DriveController::class, 'downloadShared']);
    Route::get('/{token}/preview',  [DriveController::class, 'previewShared']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Partner Portal — partner role only
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:partner'])->prefix('partner-portal')->group(function () {
    Route::get('/stats',     [\App\Http\Controllers\PartnerDataController::class, 'getDashboardStats']);
    Route::get('/investors', [\App\Http\Controllers\PartnerDataController::class, 'getSharedBuyers']);
    Route::get('/targets',   [\App\Http\Controllers\PartnerDataController::class, 'getSharedSellers']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Routes registered EARLY (before admin group) for correct wildcard priority.
// All authenticated users (admin, staff, partner where applicable).
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Industries stats & adhoc — before admin apiResource wildcard captures them
    Route::get('/industries/stats', [IndustryController::class, 'stats']);
    Route::get('/industries/adhoc', [IndustryController::class, 'adhoc']);

    // Employee list for PIC picker — staff needs this for Create Deal modal
    Route::get('/employees/fetch', [EmployeeController::class, 'fetchAllEmployees']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin-only routes (System Admin role required)
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:System Admin'])->group(function () {

    // Roles
    Route::get('/roles', [RoleController::class, 'index']);

    // Employee / HR  (employees/fetch is in the early auth:sanctum group for all users)
    Route::get('/employees/assigned-projects/{employeeId}', [EmployeeController::class, 'assigned_projects']);
    Route::post('/employees/deletion-impact', [EmployeeController::class, 'deletionImpact']);
    Route::delete('/employees', [EmployeeController::class, 'destroy']);
    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('designations', DesignationController::class);
    Route::apiResource('teams', TeamController::class);
    Route::apiResource('branches', BranchController::class);
    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('companies', CompanyController::class);

    // Currency (write operations)
    Route::delete('/currencies', [CurrencyController::class, 'destroy']);
    Route::post('/currencies/refresh', [CurrencyController::class, 'refreshRates']);
    Route::apiResource('currencies', CurrencyController::class);

    // Country (write operations)
    Route::apiResource('countries', CountryController::class);

    // General Settings
    Route::get('/general-settings', [\App\Http\Controllers\GeneralSettingsController::class, 'index']);
    Route::post('/general-settings', [\App\Http\Controllers\GeneralSettingsController::class, 'update']);

    // Pipeline Stages
    Route::post('/pipeline-stages/bulk', [PipelineStageController::class, 'updateBulk']);
    Route::get('/pipeline-stages', [PipelineStageController::class, 'index']);
    Route::post('/pipeline-stages', [PipelineStageController::class, 'store']);
    Route::patch('/pipeline-stages/{pipelineStage}', [PipelineStageController::class, 'update']);
    Route::delete('/pipeline-stages/{pipelineStage}', [PipelineStageController::class, 'destroy']);

    // Fee Tiers
    Route::get('/fee-tiers', [\App\Http\Controllers\FeeTierController::class, 'index']);
    Route::post('/fee-tiers/bulk', [\App\Http\Controllers\FeeTierController::class, 'updateBulk']);

    // Industries (write/admin actions only)
    Route::post('industries/promote', [IndustryController::class, 'promote']);
    Route::post('industries/merge', [IndustryController::class, 'merge']);
    Route::post('industries/rename-adhoc', [IndustryController::class, 'renameAdhoc']);
    Route::apiResource('industries', IndustryController::class);

    // Partner Portal Configuration (admin config, not partner-read)
    Route::get('/partner-settings', [\App\Http\Controllers\PartnerSettingController::class, 'index']);
    Route::post('/partner-settings', [\App\Http\Controllers\PartnerSettingController::class, 'update']);

    // Audit Logs
    Route::prefix('audit-logs')->group(function () {
        Route::get('/',              [\App\Http\Controllers\AuditLogController::class, 'index']);
        Route::get('/summary',       [\App\Http\Controllers\AuditLogController::class, 'actionsSummary']);
        Route::get('/user/{userId}', [\App\Http\Controllers\AuditLogController::class, 'userActivity']);
    });

    // Admin User Management (reset passwords, activate/deactivate)
    Route::prefix('admin/users')->group(function () {
        Route::post('/{id}/reset-password', [\App\Http\Controllers\AdminUserController::class, 'resetPassword']);
        Route::patch('/{id}/status',        [\App\Http\Controllers\AdminUserController::class, 'updateStatus']);
    });

    // Import Templates (admin generates templates)
    Route::get('/import/template/{type}', [ImportTemplateController::class, 'download']);

    // Avatar uploads — admin context
    Route::post('/employees/{id}/avatar',   [EmployeeController::class, 'uploadAvatar']);
    Route::post('/partners/{id}/avatar',    [PartnerController::class,  'uploadAvatar']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared READ routes — Admin + Staff + Partner
// Each URI is registered ONCE here. Partners get read access to prospect
// listings/details; controllers handle data filtering per role.
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:System Admin|Staff|partner'])->group(function () {

    // User Table Preferences (all roles can customize their own columns)
    Route::get('/user/table-preferences/{tableType}',    [UserTablePreferenceController::class, 'show']);
    Route::put('/user/table-preferences/{tableType}',    [UserTablePreferenceController::class, 'update']);
    Route::delete('/user/table-preferences/{tableType}', [UserTablePreferenceController::class, 'destroy']);

    // Country (read)
    Route::get('/countries',        [CountryController::class, 'index']);
    Route::get('/countries/{id}',   [CountryController::class, 'show']);

    // Target (Seller) — READ routes (listings, detail, filter ranges)
    // CRITICAL: specific /target/* and /seller/* routes MUST come before wildcard {seller}
    Route::get('/target/fetch',             [TargetController::class, 'fetchAll']);
    Route::get('/target/pinned',            [TargetController::class, 'pinnedData']);
    Route::get('/target/unpinned',          [TargetController::class, 'unpinnedData']);
    Route::get('/target/investment-range',  [TargetController::class, 'investmentRange']);
    Route::get('/target/ebitda-range',      [TargetController::class, 'ebitdaRange']);
    Route::get('/seller/fetch',             [TargetController::class, 'fetchAll']);
    Route::get('/seller/pinned',            [TargetController::class, 'pinnedData']);
    Route::get('/seller/unpinned',          [TargetController::class, 'unpinnedData']);
    Route::get('/seller/investment-range',  [TargetController::class, 'investmentRange']);
    Route::get('/seller/ebitda-range',      [TargetController::class, 'ebitdaRange']);

    // Investor (Buyer) — READ routes (listings, detail, filter ranges)
    Route::get('/investor/fetch',           [InvestorController::class, 'fetchAll']);
    Route::get('/investor/pinned',          [InvestorController::class, 'pinnedData']);
    Route::get('/investor/unpinned',        [InvestorController::class, 'unpinnedData']);
    Route::get('/investor/budget-range',    [InvestorController::class, 'budgetRange']);
    Route::get('/buyer/fetch',              [InvestorController::class, 'fetchAll']);
    Route::get('/buyer/budget-range',       [InvestorController::class, 'budgetRange']);

    // ── Admin/Staff-only GET routes that MUST be registered BEFORE wildcard {seller}/{buyer} ──
    // These are placed here to prevent the wildcard routes below from intercepting
    // requests like /seller/get-last-sequence (which would be treated as {seller}="get-last-sequence")
    Route::middleware(['role:System Admin|Staff'])->group(function () {
        // Target (Seller) — admin/staff-only named GET routes
        Route::get('/target/get-last-sequence',     [TargetController::class, 'getLastSequence']);
        Route::get('/target/check-id',              [TargetController::class, 'checkId']);
        Route::get('/target/closed',                [TargetController::class, 'closedDeals']);
        Route::get('/target/drafts',                [TargetController::class, 'drafts']);
        Route::get('/target/partnerships',          [TargetController::class, 'partnerships']);
        Route::get('/target/delete-analyze',        [TargetController::class, 'getDeleteImpact']);
        Route::get('/seller/get-last-sequence',     [TargetController::class, 'getLastSequence']);
        Route::get('/seller/check-id',              [TargetController::class, 'checkId']);
        Route::get('/seller/drafts',                [TargetController::class, 'drafts']);
        Route::get('/seller/delete-analyze',        [TargetController::class, 'getDeleteImpact']);
        Route::get('/seller/closed',                [TargetController::class, 'closedDeals']);
        Route::get('/seller/partnerships',          [TargetController::class, 'partnerships']);

        // Investor (Buyer) — admin/staff-only named GET routes
        Route::get('/investor/get-last-sequence',   [InvestorController::class, 'getLastSequence']);
        Route::get('/investor/check-id',            [InvestorController::class, 'checkId']);
        Route::get('/investor/closed-deals',        [InvestorController::class, 'closedDeals']);
        Route::get('/investor/drafts',              [InvestorController::class, 'drafts']);
        Route::get('/investor/from-partners',       [InvestorController::class, 'fromPartners']);
        Route::get('/investor/delete-analyze',      [InvestorController::class, 'getDeleteImpact']);
        Route::get('/buyer/get-last-sequence',      [InvestorController::class, 'getLastSequence']);
        Route::get('/buyer/check-id',               [InvestorController::class, 'checkId']);
        Route::get('/buyer/drafts',                 [InvestorController::class, 'drafts']);
    });

    // Index routes — used by frontend for ?status=Draft checks + main table listing
    Route::get('/seller',                   [TargetController::class, 'index']);
    Route::get('/buyer',                    [InvestorController::class, 'index']);
    // Detail view (wildcard) — MUST come AFTER all specific /seller/* and /buyer/* routes
    Route::get('/seller/{seller}',          [TargetController::class, 'show']);
    Route::get('/buyer/{buyer}',            [InvestorController::class, 'show']);

    // Pipeline Stages (read — needed for filter dropdowns)
    Route::get('/pipeline-stages', [PipelineStageController::class, 'index']);

    // Fee Tiers (read)
    Route::get('/fee-tiers', [\App\Http\Controllers\FeeTierController::class, 'index']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Staff + Admin WRITE routes — partners CANNOT access these.
// Includes: prospect CRUD, deals, dashboard, MatchIQ, import, activity logs.
// NOTE: Read routes already registered in shared group above are NOT repeated.
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:System Admin|Staff'])->group(function () {

    // Target (Seller) — admin/staff-only WRITE routes (GET routes moved to shared group above)
    Route::delete('/targets',                   [TargetController::class, 'destroy']);
    // Seller WRITE routes (POST, DELETE) — must be before apiResource
    Route::post('/seller/company-overviews',         [TargetController::class, 'sellerCompanyOverviewstore']);
    Route::post('/seller/financial-details',         [TargetController::class, 'sellerFinancialDetailsstore']);
    Route::post('/seller/teaser-center',             [TargetController::class, 'sellerTeaserCenterstore']);
    Route::post('/seller/partnership-details',       [TargetController::class, 'sellerPartnershipDetailsstore']);
    Route::post('/seller/{seller}/pinned',           [TargetController::class, 'pinned']);
    Route::post('/seller/{seller}/avatar',           [TargetController::class, 'uploadAvatar']);
    Route::delete('/seller',                         [TargetController::class, 'destroy']);
    // apiResource ONLY for write methods — index/show already in shared group, must NOT be overwritten
    Route::apiResource('seller', TargetController::class)->only(['store', 'update', 'destroy']);
    // Legacy /target/* WRITE routes
    Route::post('/target/company-overviews',         [TargetController::class, 'sellerCompanyOverviewstore']);
    Route::post('/target/financial-details',         [TargetController::class, 'sellerFinancialDetailsstore']);
    Route::post('/target/teaser-center',             [TargetController::class, 'sellerTeaserCenterstore']);
    Route::post('/target/partnership-details',       [TargetController::class, 'sellerPartnershipDetailsstore']);
    Route::post('/target/{seller}/pinned',           [TargetController::class, 'pinned']);


    // Investor (Buyer) — admin/staff-only WRITE routes (GET routes moved to shared group above)
    Route::delete('/investors',                 [InvestorController::class, 'destroy']);
    Route::delete('/buyer',                     [InvestorController::class, 'destroy']);
    Route::delete('/investor',                  [InvestorController::class, 'destroy']);
    // Buyer WRITE routes
    // apiResource ONLY for write methods — index/show already in shared group
    Route::apiResource('buyer', InvestorController::class)->only(['store', 'update', 'destroy']);
    Route::post('/investor/company-overviews',  [InvestorController::class, 'companyOverviewStore']);
    Route::post('/investor/financial-details',  [InvestorController::class, 'financialDetailsStore']);
    Route::post('/investor/target-preferences', [InvestorController::class, 'targetPreferencesStore']);
    Route::post('/investor/partnership-details',[InvestorController::class, 'partnershipDetailsStore']);
    Route::post('/investor/teaser-center',      [InvestorController::class, 'teaserCenterStore']);
    Route::post('/investor/{buyer}/pinned',     [InvestorController::class, 'pinned']);
    Route::post('/buyer/{id}/avatar',           [InvestorController::class, 'uploadAvatar']);

    // Partner Routes (admin/staff manage partners — read + write)
    Route::get('/partner/get-last-sequence',              [PartnerController::class, 'getLastSequence']);
    Route::get('/partner/check-id',                       [PartnerController::class, 'checkId']);
    Route::delete('/partners',                            [PartnerController::class, 'destroy']);
    Route::get('/partners/{partner}/shared-sellers',      [PartnerController::class, 'sharedSellers']);
    Route::get('/partners/{partner}/shared-buyers',       [PartnerController::class, 'sharedBuyers']);
    Route::get('/partners/fetch',                         [PartnerController::class, 'fetchPartner']);
    Route::apiResource('partners', PartnerController::class);
    Route::post('/partner-overviews',                     [PartnerController::class, 'partnerOverviewsStore']);
    Route::get('/partner-overviews/{id}',                 [PartnerController::class, 'partnerOverviewShow']);
    Route::get('/partner-structure/{id}',                 [PartnerController::class, 'partnerStructureShow']);
    Route::post('/partner-partnership-structures',        [PartnerController::class, 'partnerPartnershipStructuresStore']);

    // Partner Account Management (multi-account)
    Route::post('/partners/{id}/accounts',               [PartnerController::class, 'addAccount']);
    Route::delete('/partners/{id}/accounts/{userId}',    [PartnerController::class, 'removeAccount']);
    Route::put('/partners/{id}/accounts/{userId}',       [PartnerController::class, 'updateAccount']);
    Route::put('/partners/{id}/accounts/{userId}/primary', [PartnerController::class, 'setPrimaryAccount']);

    // Deals — admin/staff only
    Route::get('/deals/dashboard',                    [\App\Http\Controllers\DealController::class, 'dashboard']);
    Route::get('/deals/{deal}/stage-check',           [\App\Http\Controllers\DealController::class, 'stageCheck']);
    Route::patch('/deals/{deal}/stage',               [\App\Http\Controllers\DealController::class, 'updateStage']);
    Route::get('/deals/{deal}/delete-analyze',        [\App\Http\Controllers\DealController::class, 'deleteAnalyze']);
    Route::post('/deals/{deal}/mark-comments-read',   [\App\Http\Controllers\DealController::class, 'markCommentsRead']);
    Route::apiResource('deals', \App\Http\Controllers\DealController::class);

    // Import (staff can import data)
    Route::post('/import/validate/{type}', [ImportController::class, 'validate']);
    Route::post('/import/confirm/{type}',  [ImportController::class, 'confirm']);

    // Activity Logs — admin/staff only
    Route::get('/activity-logs',          [\App\Http\Controllers\ActivityLogController::class, 'index']);
    Route::post('/activity-logs',         [\App\Http\Controllers\ActivityLogController::class, 'store']);
    Route::delete('/activity-logs/{id}',  [\App\Http\Controllers\ActivityLogController::class, 'destroy']);

    // Dashboard — admin/staff only
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats',          [DashboardController::class, 'stats']);
        Route::get('/pipeline',       [DashboardController::class, 'pipeline']);
        Route::get('/monthly-report', [DashboardController::class, 'monthlyReport']);
        Route::get('/activity',       [DashboardController::class, 'activity']);
        Route::get('/recent',         [DashboardController::class, 'recent']);
        Route::get('/data',           [DashboardController::class, 'getSellerBuyerData']);
        Route::get('/counts',         [DashboardController::class, 'getCounts']);
    });

    // MatchIQ — admin/staff only
    Route::prefix('matchiq')->group(function () {
        Route::get('/',              [MatchController::class, 'index']);
        Route::get('/stats',         [MatchController::class, 'stats']);
        Route::get('/match/{id}',    [MatchController::class, 'show']);
        Route::get('/investor/{id}', [MatchController::class, 'forInvestor']);
        Route::get('/target/{id}',   [MatchController::class, 'forTarget']);
        Route::post('/rescan',       [MatchController::class, 'rescan']);
        Route::post('/{id}/dismiss',     [MatchController::class, 'dismiss']);
        Route::post('/{id}/approve',     [MatchController::class, 'approve']);
        Route::post('/{id}/create-deal', [MatchController::class, 'createDeal']);
    });

    // ── Flowdrive — file & folder management for prospects ──
    Route::prefix('drive')->group(function () {
        // Search (must come before wildcard listing routes)
        Route::get('/{type}/{prospectId}/search',                  [DriveController::class, 'search']);

        // Stats (lightweight counts — for CloudFlow card previews)
        Route::get('/{type}/{prospectId}/stats',                   [DriveController::class, 'stats']);

        // Listing
        Route::get('/{type}/{prospectId}',                          [DriveController::class, 'index']);
        Route::get('/{type}/{prospectId}/folder/{folderId}',       [DriveController::class, 'folderContents']);

        // Folder operations
        Route::post('/{type}/{prospectId}/folder',                 [DriveController::class, 'createFolder']);
        Route::put('/folder/{folderId}',                           [DriveController::class, 'renameFolder']);
        Route::delete('/folder/{folderId}',                        [DriveController::class, 'deleteFolder']);

        // Bulk operations
        Route::post('/{type}/{prospectId}/bulk-download',          [DriveController::class, 'bulkDownload']);
        Route::post('/{type}/{prospectId}/move',                   [DriveController::class, 'bulkMove']);
        Route::get('/{type}/{prospectId}/folder-tree',             [DriveController::class, 'folderTree']);

        // File upload
        Route::post('/{type}/{prospectId}/upload',                 [DriveController::class, 'upload']);
        Route::post('/{type}/{prospectId}/upload-chunk',           [DriveController::class, 'uploadChunk']);
        Route::post('/{type}/{prospectId}/upload-complete',        [DriveController::class, 'uploadComplete']);

        // File operations
        Route::put('/file/{fileId}',                               [DriveController::class, 'renameFile']);
        Route::delete('/file/{fileId}',                            [DriveController::class, 'deleteFile']);
        Route::get('/file/{fileId}/download',                      [DriveController::class, 'downloadFile']);
        Route::get('/file/{fileId}/preview',                       [DriveController::class, 'previewFile']);

        // Version control
        Route::post('/file/{fileId}/replace',                      [DriveController::class, 'replaceFile']);
        Route::get('/file/{fileId}/versions',                      [DriveController::class, 'listVersions']);
        Route::get('/file/{fileId}/versions/{versionId}/download', [DriveController::class, 'downloadVersion']);

        // Comments
        Route::post('/file/{fileId}/comment',                      [DriveController::class, 'addComment']);
        Route::get('/file/{fileId}/comments',                      [DriveController::class, 'listComments']);
        Route::delete('/comment/{commentId}',                      [DriveController::class, 'deleteComment']);

        // Sharing
        Route::post('/share',                                      [DriveController::class, 'createShare']);
        Route::delete('/share/{shareId}',                          [DriveController::class, 'revokeShare']);
        Route::get('/file/{fileId}/shares',                        [DriveController::class, 'listShares']);
        Route::get('/shared/{token}/resolve',                      [DriveController::class, 'resolveShareLocation']);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// All authenticated users (any role) — profile & password
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',               [AuthController::class, 'logout']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);
    Route::post('/change-password',      [AuthController::class, 'changePassword']);
    Route::get('/user',                  [AuthController::class, 'user']);

    // Read-only access to currencies and general settings for all roles (including partner)
    Route::get('/currencies',            [CurrencyController::class, 'index']);
    Route::get('/general-settings',      [\App\Http\Controllers\GeneralSettingsController::class, 'index']);
    Route::get('/countries',             [CountryController::class, 'index']);
    Route::get('/countries/{id}',        [CountryController::class, 'show']);

    // Industries (read-only — for filter dropdowns + settings pages; all roles need this)
    // stats & adhoc are also registered above (before admin group) for route priority
    Route::get('/industries',        [IndustryController::class, 'index']);

    // Global Search — accessible to all authenticated users (controller handles role-based filtering)
    Route::get('/search',                [SearchController::class, 'index']);

    // Notifications — accessible to all authenticated users
    Route::get('/notifications',                     [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',        [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read',      [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read',          [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}',             [NotificationController::class, 'destroy']);
});
