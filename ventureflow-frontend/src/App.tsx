import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import AppRoutes from "./routes/AppRoutes";
import "@fontsource/poppins/500.css";
import "@fontsource/roboto";
import { AuthProvider } from "./routes/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

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
          <Content
            sidebarExpanded={sidebarExpanded}
            setSidebarExpanded={setSidebarExpanded}
            mobileMenuOpen={mobileMenuOpen}
            toggleMobileMenu={toggleMobileMenu}
          />
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
  const hideLayout = location.pathname === "/login";

  return (
    <div className="min-h-screen bg-white">
      {!hideLayout && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => toggleMobileMenu()}
        />
      )}
      {!hideLayout && (
        <Header
          mobileMenuOpen={mobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
        />
      )}
      {!hideLayout && (
        <Sidebar
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          mobileMenuOpen={mobileMenuOpen}
        />
      )}
      <main
        className={`transition-all duration-300 min-h-screen w-full overflow-x-hidden
    ${hideLayout
            ? "p-0 m-0 flex justify-center items-center h-screen"
            : "bg-white"
          }
    ${!hideLayout ? "pt-16" : ""}
    ${!hideLayout && sidebarExpanded ? "md:pl-64" : ""}
    ${!hideLayout && !sidebarExpanded ? "md:pl-16" : ""}
    ${mobileMenuOpen ? "overflow-hidden" : ""}`}
      >
        <AppRoutes />
      </main>
    </div>
  );
};

export default App;
