import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import CreateEmployee from "../pages/employee/create/CreateEmployee";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import Login from "../pages/auth/Login";
import CurrencyTable from "../pages/currency/CurrencyTable";
import Register from "../pages/currency/Register";

import EmployeeDetails from "../pages/employee/details/EmployeeDetails";

import AddSeller from "../pages/prospects/forms/AddSeller";
import AddBuyer from "../pages/prospects/forms/AddBuyer";
import InvestorDetails from "../pages/prospects/components/InvestorDetails";
import Dashboard from "../pages/Dashboard";
import TargetDetails from "../pages/prospects/components/TargetDetails";
import Settings from "../pages/settings/Settings";
import ProspectsPortal from "../pages/prospects/ProspectsPortal";
import DealPipeline from "../pages/deals/DealPipeline";
import PartnerManagement from "../pages/settings/components/PartnerManagement";
import StaffManagement from "../pages/settings/components/StaffManagement";
import CreateStaff from "../pages/settings/components/CreateStaff";
import GeneralSettings from "../pages/settings/components/GeneralSettings";
import PipelineSettings from "../pages/settings/components/PipelineSettings";
import ChangePassword from "../pages/auth/ChangePassword";
import PartnerPortalDetails from "../pages/partner-portal/partner-portal-view/PartnerPortalDetails";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

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
        path="/deal-pipeline"
        element={
          <ProtectedRoute>
            <DealPipeline />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prospects/add-target"
        element={
          <ProtectedRoute>
            <AddSeller />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prospects/edit-target/:id"
        element={
          <ProtectedRoute>
            <AddSeller />
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
            <AddBuyer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prospects/edit-investor/:id"
        element={
          <ProtectedRoute>
            <AddBuyer />
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
        <Route path="currency" element={<CurrencyTable />} />
        <Route path="currency/add" element={<Register />} />
        <Route path="currency/edit/:id" element={<Register />} />
        <Route path="partners" element={<PartnerManagement />} />
        <Route path="partners/:id" element={<PartnerPortalDetails />} />
        <Route path="pipeline" element={<PipelineSettings />} />
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
