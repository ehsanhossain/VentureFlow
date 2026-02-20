import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import CreateEmployee from "../pages/employee/create/CreateEmployee";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import Login from "../pages/auth/Login";
import CurrencyTable from "../pages/currency/CurrencyTable";
import Register from "../pages/currency/Register";

import EmployeeDetails from "../pages/employee/details/EmployeeDetails";

import InvestorRegistrationPage from "../pages/prospects/forms/InvestorRegistrationPage";
import TargetRegistrationPage from "../pages/prospects/forms/TargetRegistrationPage";
import InvestorDetails from "../pages/prospects/components/InvestorDetails";
import Dashboard from "../pages/Dashboard";
import TargetDetails from "../pages/prospects/components/TargetDetails";
import Settings from "../pages/settings/Settings";
import ProspectsPortal from "../pages/prospects/ProspectsPortal";
import DraftsPage from "../pages/prospects/DraftsPage";
import DealPipeline from "../pages/deals/DealPipeline";
import PartnerManagement from "../pages/settings/components/PartnerManagement";
import StaffManagement from "../pages/settings/components/StaffManagement";
import CreateStaff from "../pages/settings/components/CreateStaff";
import StaffDetails from "../pages/settings/components/StaffDetails";
import PartnerDetails from "../pages/settings/components/PartnerDetails";
import AuditLog from "../pages/settings/components/AuditLog";
import GeneralSettings from "../pages/settings/components/GeneralSettings";
import PipelineSettings from "../pages/settings/components/PipelineSettings";
import FeeStructureSettings from "../pages/settings/components/FeeStructureSettings";
import IndustrySettings from "../pages/settings/components/IndustrySettings";
import ChangePassword from "../pages/auth/ChangePassword";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import CreatePartner from '../pages/settings/components/CreatePartner';
import PartnerProfile from '../pages/settings/components/PartnerProfile';
import MatchIQ from '../pages/matching/MatchIQ';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Prospects */}
      <Route
        path="/prospects"
        element={
          <ProtectedRoute>
            <ProspectsPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prospects/drafts"
        element={
          <ProtectedRoute>
            <DraftsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/deal-pipeline"
        element={
          <ProtectedRoute>
            <DealPipeline />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matchiq"
        element={
          <ProtectedRoute>
            <MatchIQ />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prospects/add-target"
        element={
          <ProtectedRoute>
            <TargetRegistrationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prospects/edit-target/:id"
        element={
          <ProtectedRoute>
            <TargetRegistrationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prospects/target/:id"
        element={
          <ProtectedRoute>
            <TargetDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/prospects/add-investor"
        element={
          <ProtectedRoute>
            <InvestorRegistrationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prospects/edit-investor/:id"
        element={
          <ProtectedRoute>
            <InvestorRegistrationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prospects/investor/:id"
        element={
          <ProtectedRoute>
            <InvestorDetails />
          </ProtectedRoute>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      >
        <Route path="general" element={<GeneralSettings />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="staff/create" element={<CreateStaff />} />
        <Route path="staff/edit/:id" element={<CreateStaff />} />
        <Route path="staff/view/:id" element={<StaffDetails />} />
        <Route path="currency" element={<CurrencyTable />} />
        <Route path="currency/add" element={<Register />} />
        <Route path="currency/edit/:id" element={<Register />} />
        <Route path="partners" element={<PartnerManagement />} />
        <Route path="partners/:id" element={<PartnerDetails />} />
        <Route path="partners/create" element={<CreatePartner />} />
        <Route path="partners/edit/:id" element={<CreatePartner />} />
        <Route path="pipeline" element={<PipelineSettings />} />
        <Route path="industries" element={<IndustrySettings />} />
        <Route path="fee-structure" element={<FeeStructureSettings />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="profile" element={<PartnerProfile />} />
      </Route>

      {/* Profile & Employee Edit */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <CreateEmployee />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/details/:id"
        element={
          <ProtectedRoute>
            <EmployeeDetails />
          </ProtectedRoute>
        }
      />

      {/* Notifications */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
