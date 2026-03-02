/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, useLocation, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import AppRoutes from "./routes/AppRoutes";
import "@fontsource/poppins/500.css";
import "@fontsource/roboto";
import { AuthProvider, AuthContext } from "./routes/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { GeneralSettingsProvider } from "./context/GeneralSettingsContext";

function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (isMobile) {
      setSidebarExpanded(true);
    }
  };

  return (
    <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <NotificationProvider>
          <GeneralSettingsProvider>
            <Content
              sidebarExpanded={sidebarExpanded}
              setSidebarExpanded={setSidebarExpanded}
              mobileMenuOpen={mobileMenuOpen}
              toggleMobileMenu={toggleMobileMenu}
            />
          </GeneralSettingsProvider>
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}

interface ContentProps {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

const Content: React.FC<ContentProps> = ({
  sidebarExpanded,
  setSidebarExpanded,
  mobileMenuOpen,
  toggleMobileMenu,
}) => {
  const location = useLocation();
  const auth = useContext(AuthContext);
  const isPartner = auth?.isPartner ?? false;
  const user = auth?.user;

  const authPaths = ["/login", "/change-password", "/forgot-password", "/reset-password"];
  const hideLayout = authPaths.includes(location.pathname);

  // If partner lands on admin routes, redirect to partner-portal
  const isPartnerOnAdminRoute = isPartner && user && !location.pathname.startsWith('/partner-portal') && !hideLayout && !location.pathname.startsWith('/change-password');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        setSidebarExpanded(!sidebarExpanded);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarExpanded, setSidebarExpanded]);

  // Redirect partner away from admin routes
  if (isPartnerOnAdminRoute) {
    return <Navigate to="/partner-portal" replace />;
  }

  // Partner portal uses its own PartnerLayout (rendered inside AppRoutes)
  const isPartnerPortal = location.pathname.startsWith('/partner-portal');

  return (
    <div className={hideLayout ? "h-screen w-full overflow-hidden" : "min-h-screen bg-white"}>
      {!hideLayout && mobileMenuOpen && !isPartnerPortal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => toggleMobileMenu()}
        />
      )}
      {!hideLayout && !isPartnerPortal && (
        <Header
          mobileMenuOpen={mobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
          sidebarExpanded={sidebarExpanded}
        />
      )}
      {!hideLayout && !isPartnerPortal && (
        <Sidebar
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          mobileMenuOpen={mobileMenuOpen}
        />
      )}
      <main
        className={`transition-all duration-300 w-full overflow-x-hidden
    ${hideLayout
            ? "h-screen"
            : "min-h-screen bg-white"
          }
    ${!hideLayout ? "pt-16" : ""}
    ${!hideLayout && sidebarExpanded && !isPartnerPortal ? "md:pl-64" : ""}
    ${!hideLayout && !sidebarExpanded && !isPartnerPortal ? "md:pl-16" : ""}
    ${isPartnerPortal ? "!pt-0 !pl-0" : ""}
    ${mobileMenuOpen ? "overflow-hidden" : ""}`}
      >
        <AppRoutes />
      </main>
    </div>
  );
};

export default App;
