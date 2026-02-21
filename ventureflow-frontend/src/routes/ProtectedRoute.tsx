/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useContext, ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { BrandSpinner } from "../components/BrandSpinner";

interface AuthContextType {
  user: unknown;
  loading: boolean;
  login: (credentials: unknown) => Promise<unknown>;
  logout: () => Promise<void>;
}

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useContext(AuthContext) as AuthContextType;
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <BrandSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    localStorage.setItem("intended_url", location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
