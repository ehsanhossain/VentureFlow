import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import CreateEmployee from "../pages/employee/create/CreateEmployee";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import Login from "../pages/auth/Login";
import CurrencyTable from "../pages/currency/CurrencyTable";
import IndexEmployee from "../pages/employee/IndexEmployee";
import Register from "../pages/currency/Register";
import BuyerPortal from "../pages/buyer-portal/BuyerPortal";
import EmployeeDetails from "../pages/employee/details/EmployeeDetails";

import SellerPortal from "../pages/seller-portal/index/SellerPortal";
import AddSeller from "../pages/seller-portal/create/AddSeller";

import AddBuyer from "../pages/buyer-portal/create-buyer/AddBuyer";
import BuyerPortalDetails from "../pages/buyer-portal/buyer-portal-view/BuyerPortalDetails";
import Dashboard from "../pages/Dashboard";
import SellerPortalDetails from "../pages/seller-portal/seller-portal-view/SellerPortalDetails";
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
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
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
        path="/seller-portal"
        element={
          <ProtectedRoute>
            <SellerPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller-portal/add"
        element={
          <ProtectedRoute>
            <AddSeller />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller-portal/edit/:id"
        element={
          <ProtectedRoute>
            <AddSeller />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller-portal/view/:id"
        element={
          <ProtectedRoute>
            <SellerPortalDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buyer-portal"
        element={
          <ProtectedRoute>
            <BuyerPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer-portal/create"
        element={
          <ProtectedRoute>
            <AddBuyer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer-portal/edit/:id"
        element={
          <ProtectedRoute>
            <AddBuyer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer-portal/view/:id"
        element={
          <ProtectedRoute>
            <BuyerPortalDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee"
        element={
          <ProtectedRoute>
            <IndexEmployee />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/edit/:id"
        element={
          <ProtectedRoute>
            <CreateEmployee />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/add"
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
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <CreateEmployee />
          </ProtectedRoute>
        }
      />
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
