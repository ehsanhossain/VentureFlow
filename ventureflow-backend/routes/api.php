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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\PartnerController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\InvestorController;
use App\Http\Controllers\IndustryController;
use App\Http\Controllers\RoleController;
use App\Models\Employee;
use App\Http\Controllers\PipelineStageController;
use App\Http\Controllers\SearchController;

use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserTablePreferenceController;
use App\Http\Controllers\MatchController;

Route::post('/login', [AuthController::class, 'login']);


// API
Route::get('/deals/seller', [ApiController::class, 'getSellerDealInfo']);
Route::post('/ai/extract', [\App\Http\Controllers\AIController::class, 'extract']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/search', [SearchController::class, 'index']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);
    Route::post('/change-password', [AuthController::class, 'changePassword']); // Alias

    Route::get('/user', [AuthController::class, 'user']);

    //Role Routes
    Route::get('/roles', [RoleController::class, 'index']);

    //Employee Routes

    Route::get('/employees/fetch', [EmployeeController::class, 'fetchAllEmployees']);
    Route::get('/employees/assigned-projects/{employeeId}', [EmployeeController::class, 'assigned_projects']);
    Route::delete('/employees', [EmployeeController::class, 'destroy']);
    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('designations', DesignationController::class);
    Route::apiResource('teams', TeamController::class);
    Route::apiResource('branches', BranchController::class);
    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('companies', CompanyController::class);


    //Country Routes
    Route::apiResource('countries', CountryController::class);

    //Currency Routes
    Route::delete('/currencies', [CurrencyController::class, 'destroy']);
    Route::post('/currencies/refresh', [CurrencyController::class, 'refreshRates']);
    Route::apiResource('currencies', CurrencyController::class);

    // General Settings Routes
    Route::get('/general-settings', [\App\Http\Controllers\GeneralSettingsController::class, 'index']);
    Route::post('/general-settings', [\App\Http\Controllers\GeneralSettingsController::class, 'update']);

    //Seller Routes
    Route::get('/target/fetch', [TargetController::class, 'fetchAll']);
    Route::get('/target/get-last-sequence', [TargetController::class, 'getLastSequence']);
    Route::get('/target/check-id', [TargetController::class, 'checkId']);
    Route::get('/target/pinned', [TargetController::class, 'pinnedData']);
    Route::get('/target/unpinned', [TargetController::class, 'unpinnedData']);
    Route::get('/target/closed', [TargetController::class, 'closedDeals']);
    Route::get('/target/drafts', [TargetController::class, 'drafts']);
    Route::get('/target/partnerships', [TargetController::class, 'partnerships']);
    Route::get('/target/delete-analyze', [TargetController::class, 'getDeleteImpact']);
    Route::get('/target/investment-range', [TargetController::class, 'investmentRange']);
    Route::get('/target/ebitda-range', [TargetController::class, 'ebitdaRange']);
    Route::delete('/targets', [TargetController::class, 'destroy']);
    Route::apiResource('seller', TargetController::class);
    Route::post('/target/company-overviews', [TargetController::class, 'sellerCompanyOverviewstore']);
    Route::post('/target/financial-details', [TargetController::class, 'sellerFinancialDetailsstore']);
    Route::post('/target/teaser-center', [TargetController::class, 'sellerTeaserCenterstore']);
    Route::post('/target/partnership-details', [TargetController::class, 'sellerPartnershipDetailsstore']);
    Route::get('/target/{sellerId}/folders', [FolderController::class, 'sellerFolders']);
    Route::post('/target/{seller}/pinned', [TargetController::class, 'pinned']);


    //Partner Routes
    Route::get('/partner/get-last-sequence', [PartnerController::class, 'getLastSequence']);
    Route::get('/partner/check-id', [PartnerController::class, 'checkId']);
    Route::delete('/partners', [PartnerController::class, 'destroy']);
    Route::get('/partners/{partner}/shared-sellers', [PartnerController::class, 'sharedSellers']);
    Route::get('/partners/{partner}/shared-buyers', [PartnerController::class, 'sharedBuyers']);
    Route::get('/partners/fetch', [PartnerController::class, 'fetchPartner']); // Moved up
    Route::apiResource('partners', PartnerController::class); // Changed to plural
    Route::post('/partner-overviews', [PartnerController::class, 'partnerOverviewsStore']);
    Route::get('/partner-overviews/{id}', [PartnerController::class, 'partnerOverviewShow']);
    Route::get('/partner-structure/{id}', [PartnerController::class, 'partnerStructureShow']);
    Route::post('/partner-partnership-structures', [PartnerController::class, 'partnerPartnershipStructuresStore']);
    Route::get('/partners/{partnerId}/folders', [FolderController::class, 'partnerFolders']);


    // Buyers Routes
    Route::get('/investor/fetch', [InvestorController::class, 'fetchAll']);
    Route::get('/investor/get-last-sequence', [InvestorController::class, 'getLastSequence']);
    Route::get('/investor/check-id', [InvestorController::class, 'checkId']);
    Route::get('/investor/pinned', [InvestorController::class, 'pinnedData']);
    Route::get('/investor/unpinned', [InvestorController::class, 'unpinnedData']);
    Route::get('/investor/closed-deals', [InvestorController::class, 'closedDeals']);
    Route::get('/investor/drafts', [InvestorController::class, 'drafts']);
    Route::get('/investor/from-partners', [InvestorController::class, 'fromPartners']);
    Route::get('/investor/delete-analyze', [InvestorController::class, 'getDeleteImpact']);
    Route::get('/investor/budget-range', [InvestorController::class, 'budgetRange']);
    Route::delete('/investors', [InvestorController::class, 'destroy']);
    Route::apiResource('buyer', InvestorController::class);
    Route::post('/investor/company-overviews', [InvestorController::class, 'companyOverviewStore']);
    Route::post('/investor/financial-details', [InvestorController::class, 'financialDetailsStore']);
    Route::post('/investor/target-preferences', [InvestorController::class, 'targetPreferencesStore']);
    Route::post('/investor/partnership-details', [InvestorController::class, 'partnershipDetailsStore']);
    Route::post('/investor/teaser-center', [InvestorController::class, 'teaserCenterStore']);
    Route::get('/buyers/{buyerId}/folders', [FolderController::class, 'buyerFolders']);
    Route::post('/investor/{buyer}/pinned', [InvestorController::class, 'pinned']);


    // Import Routes (new 2-step flow)
    Route::get('/import/template/{type}', [ImportTemplateController::class, 'download']);
    Route::post('/import/validate/{type}', [ImportController::class, 'validate']);
    Route::post('/import/confirm/{type}', [ImportController::class, 'confirm']);


    // Folder Routes
    Route::apiResource('folders', FolderController::class);

    // File Routes
    Route::get('/files/{fileId}/download', [FileController::class, 'download']);
    Route::apiResource('files', FileController::class);

    //Industry Routes
    Route::get('industries/stats', [IndustryController::class, 'stats']);
    Route::get('industries/adhoc', [IndustryController::class, 'adhoc']);
    Route::post('industries/promote', [IndustryController::class, 'promote']);
    Route::post('industries/merge', [IndustryController::class, 'merge']);
    Route::post('industries/rename-adhoc', [IndustryController::class, 'renameAdhoc']);
    Route::apiResource('industries', IndustryController::class);

    // Deal Pipeline Routes
    Route::get('/deals/dashboard', [\App\Http\Controllers\DealController::class, 'dashboard']);
    Route::get('/deals/{deal}/stage-check', [\App\Http\Controllers\DealController::class, 'stageCheck']);
    Route::patch('/deals/{deal}/stage', [\App\Http\Controllers\DealController::class, 'updateStage']);
    Route::get('/deals/{deal}/delete-analyze', [\App\Http\Controllers\DealController::class, 'deleteAnalyze']);
    Route::apiResource('deals', \App\Http\Controllers\DealController::class);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Pipeline Stage Routes
    Route::post('/pipeline-stages/bulk', [PipelineStageController::class, 'updateBulk']);
    Route::get('/pipeline-stages', [PipelineStageController::class, 'index']);
    Route::post('/pipeline-stages', [PipelineStageController::class, 'store']);
    Route::patch('/pipeline-stages/{pipelineStage}', [PipelineStageController::class, 'update']);
    Route::delete('/pipeline-stages/{pipelineStage}', [PipelineStageController::class, 'destroy']);

    // Fee Tier Routes
    Route::get('/fee-tiers', [\App\Http\Controllers\FeeTierController::class, 'index']);
    Route::post('/fee-tiers/bulk', [\App\Http\Controllers\FeeTierController::class, 'updateBulk']);

    // Activity Log Routes
    Route::get('/activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'index']);
    Route::post('/activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'store']);
    Route::delete('/activity-logs/{id}', [\App\Http\Controllers\ActivityLogController::class, 'destroy']);

    // Partner Portal Configuration (Admin)
    Route::get('/partner-settings', [\App\Http\Controllers\PartnerSettingController::class, 'index']);
    Route::post('/partner-settings', [\App\Http\Controllers\PartnerSettingController::class, 'update']);

    // Partner Portal Data (For Partners)
    Route::prefix('partner-portal')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\PartnerDataController::class, 'getDashboardStats']);
        Route::get('/investors', [\App\Http\Controllers\PartnerDataController::class, 'getSharedBuyers']);
        Route::get('/targets', [\App\Http\Controllers\PartnerDataController::class, 'getSharedSellers']);
    });

    // Audit Log Routes (Admin only)
    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [\App\Http\Controllers\AuditLogController::class, 'index']);
        Route::get('/summary', [\App\Http\Controllers\AuditLogController::class, 'actionsSummary']);
        Route::get('/user/{userId}', [\App\Http\Controllers\AuditLogController::class, 'userActivity']);
    });

    // Dashboard Routes
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'stats']);
        Route::get('/pipeline', [DashboardController::class, 'pipeline']);
        Route::get('/monthly-report', [DashboardController::class, 'monthlyReport']);
        Route::get('/activity', [DashboardController::class, 'activity']);
        Route::get('/recent', [DashboardController::class, 'recent']);
        // Legacy aliases kept for backward compatibility
        Route::get('/data', [DashboardController::class, 'getSellerBuyerData']);
        Route::get('/counts', [DashboardController::class, 'getCounts']);
    });

    // User Table Preferences (column visibility & order)
    Route::get('/user/table-preferences/{tableType}', [UserTablePreferenceController::class, 'show']);
    Route::put('/user/table-preferences/{tableType}', [UserTablePreferenceController::class, 'update']);
    Route::delete('/user/table-preferences/{tableType}', [UserTablePreferenceController::class, 'destroy']);

    // MatchIQ — Smart Matching Engine
    Route::prefix('matchiq')->group(function () {
        Route::get('/', [MatchController::class, 'index']);
        Route::get('/stats', [MatchController::class, 'stats']);
        Route::get('/investor/{id}', [MatchController::class, 'forInvestor']);
        Route::get('/target/{id}', [MatchController::class, 'forTarget']);
        Route::post('/rescan', [MatchController::class, 'rescan']);
        Route::post('/custom-score', [MatchController::class, 'customScore']);
        Route::post('/{id}/dismiss', [MatchController::class, 'dismiss']);
        Route::post('/{id}/create-deal', [MatchController::class, 'createDeal']);
    });
});

