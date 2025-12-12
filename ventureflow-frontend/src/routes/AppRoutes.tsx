import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import CreateEmployee from "../pages/employee/create/CreateEmployee";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import Login from "../pages/auth/Login";
import CurrencyTable from "../pages/currency/CurrencyTable";
import IndexEmployee from "../pages/employee/IndexEmployee";
import Register from "../pages/currency/Register";
import BuyerPortal from "../pages/buyer-portal/BuyerPortal";
import PartnerPortal from "../pages/partner-portal/IndexPartnerPortal";
import EmployeeDetails from "../pages/employee/details/EmployeeDetails";
import BuyerTeaserCenter from "../pages/buyer-portal/buyer-teaser/BuyerTeaserCenter";
import SellerPortal from "../pages/seller-portal/index/SellerPortal";
import AddSeller from "../pages/seller-portal/create/AddSeller";
import AddPartner from "../pages/partner-portal/create/AddPartner";
import SellerTeaserCenter from "../pages/seller-portal/seller-teaser/SellerTeaserCenter";
import AddBuyer from "../pages/buyer-portal/create-buyer/AddBuyer";
import BuyerPortalDetails from "../pages/buyer-portal/buyer-portal-view/BuyerPortalDetails";
import PartnerPortalDetails from "../pages/partner-portal/partner-portal-view/PartnerPortalDetails";
import Dashboard from "../pages/Dashboard";
import SellerPortalDetails from "../pages/seller-portal/seller-portal-view/SellerPortalDetails";
import Settings from "../pages/settings/Settings";
import ProspectsPortal from "../pages/prospects/ProspectsPortal";
import DealPipeline from "../pages/deals/DealPipeline";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
        path="/seller-teaser-center"
        element={
          <ProtectedRoute>
            <SellerTeaserCenter />
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
        path="/buyer-teaser-center"
        element={
          <ProtectedRoute>
            <BuyerTeaserCenter />
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
        path="/partner-portal"
        element={
          <ProtectedRoute>
            <PartnerPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner-portal/create"
        element={
          <ProtectedRoute>
            <AddPartner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner-portal/edit/:id"
        element={
          <ProtectedRoute>
            <AddPartner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner-portal/view/:id"
        element={
          <ProtectedRoute>
            <PartnerPortalDetails />
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
        <Route path="currency" element={<CurrencyTable />} />
        <Route path="currency/add" element={<Register />} />
        <Route path="currency/edit/:id" element={<Register />} />
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
