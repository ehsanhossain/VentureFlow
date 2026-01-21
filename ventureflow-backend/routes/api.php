<?php
use App\Http\Controllers\ApiController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\SellerController;
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
use App\Http\Controllers\BuyerController;
use App\Http\Controllers\IndustryController;
use App\Http\Controllers\RoleController;
use App\Models\Employee;
use App\Http\Controllers\PipelineStageController;
use App\Http\Controllers\SearchController;

use App\Http\Controllers\NotificationController;

Route::post('/login', [AuthController::class, 'login']);


// API
Route::get('/deals/seller', [ApiController::class, 'getSellerDealInfo']);
Route::post('/ai/extract', [\App\Http\Controllers\AIController::class, 'extract']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/search', [SearchController::class, 'index']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);

    Route::get('/user', function (Request $request) {
        $user = $request->user();

        $employee = Employee::where('user_id', optional($user)->id)->first();

        return response()->json([
            'user' => $user,
            'employee' => $employee,
        ]);
    });

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
    Route::apiResource('currencies', CurrencyController::class);

    //Seller Routes
    Route::get('/seller/get-last-sequence', [SellerController::class, 'getLastSequence']);
    Route::get('/seller/check-id', [SellerController::class, 'checkId']);
    Route::get('/seller/pinned', [SellerController::class, 'pinnedData']);
    Route::get('/seller/unpinned', [SellerController::class, 'unpinnedData']);
    Route::get('/seller/closed', [SellerController::class, 'closedDeals']);
    Route::get('/seller/drafts', [SellerController::class, 'drafts']);
    Route::get('/seller/partnerships', [SellerController::class, 'partnerships']);
    Route::delete('/sellers', [SellerController::class, 'destroy']);
    Route::apiResource('seller', SellerController::class);
    Route::post('/seller/company-overviews', [SellerController::class, 'sellerCompanyOverviewstore']);
    Route::post('/seller/financial-details', [SellerController::class, 'sellerFinancialDetailsstore']);
    Route::post('/seller/teaser-center', [SellerController::class, 'sellerTeaserCenterstore']);
    Route::post('/seller/partnership-details', [SellerController::class, 'sellerPartnershipDetailsstore']);
    Route::get('/seller/{sellerId}/folders', [FolderController::class, 'sellerFolders']);
    Route::post('/seller/{seller}/pinned', [SellerController::class, 'pinned']);


    //Partners Routes
    //Partners Routes
    Route::get('/partner/get-last-sequence', [PartnerController::class, 'getLastSequence']);
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
    Route::get('/buyer/get-last-sequence', [BuyerController::class, 'getLastSequence']);
    Route::get('/buyer/check-id', [BuyerController::class, 'checkId']);
    Route::get('/buyer/pinned', [BuyerController::class, 'pinnedData']);
    Route::get('/buyer/unpinned', [BuyerController::class, 'unpinnedData']);
    Route::get('/buyer/closed-deals', [BuyerController::class, 'closedDeals']);
    Route::get('/buyer/drafts', [BuyerController::class, 'drafts']);
    Route::get('/buyer/from-partners', [BuyerController::class, 'fromPartners']);
    Route::delete('/buyers', [BuyerController::class, 'destroy']);
    Route::apiResource('buyer', BuyerController::class);
    Route::post('/buyer/company-overviews', [BuyerController::class, 'companyOverviewStore']);
    Route::post('/buyer/financial-details', [BuyerController::class, 'financialDetailsStore']);
    Route::post('/buyer/target-preferences', [BuyerController::class, 'targetPreferencesStore']);
    Route::post('/buyer/partnership-details', [BuyerController::class, 'partnershipDetailsStore']);
    Route::post('/buyer/teaser-center', [BuyerController::class, 'teaserCenterStore']);
    Route::get('/buyers/{buyerId}/folders', [FolderController::class, 'buyerFolders']);
    Route::post('/buyer/{buyer}/pinned', [BuyerController::class, 'pinned']);


    // Import Routes
    Route::post('/import/buyers-company-overview', [ImportController::class, 'importBuyersCompanyOverview']);
    Route::post('/import/sellers-company-overview', [ImportController::class, 'importSellersCompanyOverview']);
    Route::delete('/sellers', [SellerController::class, 'destroy']);

    // Folder Routes
    Route::apiResource('folders', FolderController::class);

    // File Routes
    Route::get('/files/{fileId}/download', [FileController::class, 'download']);
    Route::apiResource('files', FileController::class);

    //Industry Routes
    Route::apiResource('industries', IndustryController::class);

    // Dashboard Routes
    Route::get('/dashboard/data', [DashboardController::class, 'getSellerBuyerData']);
    Route::get('/dashboard/counts', [DashboardController::class, 'getCounts']);

    // Deal Pipeline Routes
    Route::get('/deals/dashboard', [\App\Http\Controllers\DealController::class, 'dashboard']);
    Route::patch('/deals/{deal}/stage', [\App\Http\Controllers\DealController::class, 'updateStage']);
    Route::apiResource('deals', \App\Http\Controllers\DealController::class);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Pipeline Stage Routes
    Route::post('/pipeline-stages/bulk', [PipelineStageController::class, 'updateBulk']);
    Route::get('/pipeline-stages', [PipelineStageController::class, 'index']);
    Route::post('/pipeline-stages', [PipelineStageController::class, 'store']);
    Route::patch('/pipeline-stages/{pipelineStage}', [PipelineStageController::class, 'update']);
    Route::delete('/pipeline-stages/{pipelineStage}', [PipelineStageController::class, 'destroy']);

    // Activity Log Routes
    Route::get('/activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'index']);
    Route::post('/activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'store']);
});
