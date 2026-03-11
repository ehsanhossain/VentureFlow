/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { Routes, Route } from "react-router-dom";
import { useContext } from "react";
import ProtectedRoute from "./ProtectedRoute";
import { AuthContext } from "./AuthContext";
import NotFoundPage from "../components/NotFoundPage";
import MyProfile from "../pages/auth/MyProfile";
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
import MatchIQ from '../pages/matching/MatchIQ';
import DriveExplorer from '../pages/prospects/drive/DriveExplorer';
import DrivePublicView from '../pages/prospects/drive/DrivePublicView';

/** Route guard: shows 404 for staff users */
const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useContext(AuthContext);
  if (auth?.isStaff) return <NotFoundPage />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* CloudFlow — public share page (no auth) */}
      <Route path="/shared/:token" element={<DrivePublicView />} />

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

      {/* CloudFlow */}
      <Route
        path="/drive/:type/:id"
        element={
          <ProtectedRoute>
            <DriveExplorer />
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
        <Route path="staff" element={<AdminOnlyRoute><StaffManagement /></AdminOnlyRoute>} />
        <Route path="staff/create" element={<AdminOnlyRoute><CreateStaff /></AdminOnlyRoute>} />
        <Route path="staff/edit/:id" element={<AdminOnlyRoute><CreateStaff /></AdminOnlyRoute>} />
        <Route path="staff/view/:id" element={<AdminOnlyRoute><StaffDetails /></AdminOnlyRoute>} />
        <Route path="currency" element={<CurrencyTable />} />
        <Route path="currency/add" element={<AdminOnlyRoute><Register /></AdminOnlyRoute>} />
        <Route path="currency/edit/:id" element={<AdminOnlyRoute><Register /></AdminOnlyRoute>} />
        <Route path="partners" element={<AdminOnlyRoute><PartnerManagement /></AdminOnlyRoute>} />
        <Route path="partners/:id" element={<AdminOnlyRoute><PartnerDetails /></AdminOnlyRoute>} />
        <Route path="partners/create" element={<AdminOnlyRoute><CreatePartner /></AdminOnlyRoute>} />
        <Route path="partners/edit/:id" element={<AdminOnlyRoute><CreatePartner /></AdminOnlyRoute>} />
        <Route path="pipeline" element={<AdminOnlyRoute><PipelineSettings /></AdminOnlyRoute>} />
        <Route path="industries" element={<IndustrySettings />} />
        <Route path="fee-structure" element={<AdminOnlyRoute><FeeStructureSettings /></AdminOnlyRoute>} />
        <Route path="audit-log" element={<AdminOnlyRoute><AuditLog /></AdminOnlyRoute>} />
        <Route path="profile" element={<MyProfile />} />
      </Route>

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MyProfile />
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
