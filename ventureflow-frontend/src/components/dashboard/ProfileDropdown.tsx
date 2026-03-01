/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useContext, useEffect, useRef, useState } from "react";
import { ChevronDown, User, LogOut, Settings } from "lucide-react";
import { AuthContext } from "../../routes/AuthContext";
import api from "../../config/api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getImageUrl, getInitialsUrl } from "../../utils/imageUrl";

interface UserData {
  name: string;
  email?: string;
}

interface Employee {
  image: string;
  id: string | number;
}

interface Partner {
  image: string;
  id: string | number;
}

const ProfileDropdown: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('AuthContext must be used within an AuthProvider');
  }
  const { logout } = context;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return; // Not logged in — skip to avoid 401 console noise
      try {
        const { data } = await api.get("/api/user");
        setUser(data.user);
        setEmployee(data.employee);
        setPartner(data.partner);
      } catch {
        // Silently handle 401 (expired token) — user will be redirected to login
      }
    };
    fetchUser();
  }, []);

  const profileImageUrl = getImageUrl(employee?.image || partner?.image)
    || getInitialsUrl(user?.name || 'User');

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded hover:bg-gray-50 transition-all duration-200 group focus:outline-none"
      >
        <div className="relative">
          <img
            src={profileImageUrl}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#064771]/20 transition-all"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold text-gray-900 group-hover:text-[#064771] transition-colors">
            {user?.name || t('profile.userName', 'User Name')}
          </span>
        </div>
        <ChevronDown className={`text-gray-400 w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right shadow-lg">
          {/* User Info Header */}
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img
                src={profileImageUrl}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover bg-gray-100"
              />
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User Name'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'admin@ventureflow.io'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => {
                // Partners go to their partner profile, staff/admin go to regular profile
                if (partner?.id) {
                  navigate('/settings/profile');
                } else {
                  navigate('/profile');
                }
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-[#064771] hover:bg-blue-50/50 rounded transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-[#064771] group-hover:text-white transition-all">
                <User className="w-4 h-4" />
              </div>
              <span className="font-medium">{partner?.id ? t('profile.myAccount', 'My Account') : t('profile.myProfile', 'My Profile')}</span>
            </button>

            <button
              onClick={() => { navigate('/settings'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-[#064771] hover:bg-blue-50/50 rounded transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-[#064771] group-hover:text-white transition-all">
                <Settings className="w-4 h-4" />
              </div>
              <span className="font-medium">{t('profile.settings', 'Settings')}</span>
            </button>
          </div>

          <div className="border-t border-gray-100 p-2 bg-gray-50/50">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-red-100/50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-medium">{t('profile.logout', 'Sign Out')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { ProfileDropdown };

export default ProfileDropdown;
