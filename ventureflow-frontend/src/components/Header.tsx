/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useRef, useState, useEffect } from "react";
import { Menu, X, Check, Search, Command, Loader2, FileText, Home, Plus, ChevronDown } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../routes/AuthContext";
import ProfileDropdown from "../components/dashboard/ProfileDropdown";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../config/api";
import {
  NotificationFalseIcon,
  NotificationTrueIcon,
  CatalystIcon,
  ProspectsIcon,
  StaffAccountsIcon,
  PartnerIconCustom,
  CurrencyIcon
} from "../assets/icons";

interface HeaderProps {
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  sidebarExpanded: boolean;
}

interface SearchResult {
  id: number | string;
  name?: string;
  status?: string;
  project_code?: string;
  country_flag?: string;
  first_name?: string;
  last_name?: string;
  work_email?: string;
  partner_id?: string;
  filename?: string;
  size?: number;
  avatar_url?: string;
  [key: string]: unknown;
}

interface SearchResults {
  deals: SearchResult[];
  investors: SearchResult[];
  targets: SearchResult[];
  staff: SearchResult[];
  partners: SearchResult[];
  documents: SearchResult[];
}

// Avatar initials helper — takes first letter of each word, max 2
const getInitials = (name?: string, firstName?: string, lastName?: string): string => {
  if (firstName || lastName) {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
  }
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Avatar component for search results
const SearchAvatar: React.FC<{ name?: string; firstName?: string; lastName?: string; avatarUrl?: string; size?: string }> = ({ name, firstName, lastName, avatarUrl, size = 'w-7 h-7' }) => {
  const [imgError, setImgError] = React.useState(false);
  const initials = getInitials(name, firstName, lastName);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || ''}
        className={`${size} rounded-full object-cover flex-none`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${size} rounded-full flex-none flex items-center justify-center text-[10px] font-semibold text-white`} style={{ backgroundColor: '#064771' }}>
      {initials}
    </div>
  );
};
export function Header({ mobileMenuOpen, toggleMobileMenu, sidebarExpanded }: HeaderProps) {
  const { t } = useTranslation();
  const auth = useContext(AuthContext);
  const isPartner = auth?.isPartner;
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const createDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Search States
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
        setCreateDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'f')) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        if (searchOpen) {
          e.preventDefault();
          e.stopPropagation();
          setSearchOpen(false);
          return; // Prevent any further ESC handling
        }
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, navigate]);

  // Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true);
        try {
          const response = await api.get('/api/search', { params: { query } });
          const data = response.data || {};
          setResults({
            deals: data.deals || [],
            investors: data.investors || [],
            targets: data.targets || [],
            staff: data.staff || [],
            partners: data.partners || [],
            documents: data.documents || [],
          });
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleNotificationClick = async (id: string, link?: string) => {
    await markAsRead(id);
    setIsOpen(false);
    if (link) {
      navigate(link);
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
    setResults(null);
  }

  const pathSegments = location.pathname.split('/').filter(Boolean);


  return (
    <>
      <header className={`h-16 bg-white border-b border-gray-200 fixed top-0 right-0 z-[80] transition-all duration-300
            ${sidebarExpanded ? 'left-64' : 'left-0 md:left-16'}
        `}>
        <div className="h-full px-4 md:px-6 flex items-center justify-between">

          {/* Left Section: Mobile Toggle + Breadcrumb/Search */}
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Premium Breadcrumbs (Desktop) */}
            <div className="hidden lg:flex items-center text-sm font-medium">
              <Link to="/" className="text-gray-400 hover:text-[#064771] transition-all p-1.5 hover:bg-gray-100 rounded">
                <Home className="w-4 h-4" />
              </Link>

              <div className="flex items-center overflow-hidden max-w-[400px]">
                {pathSegments.length > 3 && (
                  <span className="flex items-center text-gray-400 px-1">
                    <span className="mx-1 text-gray-400">/</span>
                    <span className="text-xs">...</span>
                  </span>
                )}

                {pathSegments.slice(-3).map((segment, index) => {
                  const url = `/${pathSegments.slice(0, pathSegments.length - 3 + index + 1).join('/')}`;
                  const rawName = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
                  // Map URL segments to translation keys for breadcrumb titles
                  const segmentTranslationMap: Record<string, string> = {
                    'prospects': 'navigation.companies',
                    'deal-pipeline': 'navigation.dealPipeline',
                    'dashboard': 'navigation.dashboard',
                    'settings': 'navigation.settings',
                    'employee': 'navigation.employees',
                    'general': 'navigation.general',
                    'currency': 'navigation.currency',
                    'partner-management': 'navigation.partnerManagement',
                    'staff-accounts': 'navigation.staffAndAccounts',
                    'notifications': 'navigation.notifications',
                    'profile': 'navigation.profile',
                  };
                  const translationKey = segmentTranslationMap[segment];
                  const name = translationKey ? t(translationKey) : (rawName === 'Employee' ? 'HRVC' : rawName);
                  const isLast = (pathSegments.length - 3 + index) === pathSegments.length - 1;

                  return (
                    <span key={segment} className="flex items-center group">
                      <span className="mx-1 text-gray-400">/</span>
                      <Link
                        to={url}
                        className={`
                        px-2 py-1 rounded transition-all whitespace-nowrap
                        ${isLast
                            ? 'text-[#064771] bg-blue-50/50 font-medium'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                          }
                      `}
                        title={name}
                      >
                        {name}
                      </Link>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-auto lg:ml-8 relative">
              <div
                className="w-full flex items-center bg-gray-50 border border-gray-200 rounded px-3 py-2 cursor-text hover:border-gray-300 transition-colors group"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4 text-gray-400 mr-2 group-hover:text-gray-500 transition-colors" />
                <span className="text-sm text-gray-400 font-medium">Search anything...</span>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-medium text-gray-400">
                  <span className="text-xs">⌘</span> K
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Create + Notifications + Profile */}
          <div className="flex items-center gap-3">

            {/* Add Button (Desktop) */}
            {!isPartner && (
              <div className="relative hidden md:block" ref={createDropdownRef}>
                <button
                  onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-[3px] hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium"
                >
                  <Plus className="w-4 h-4 text-gray-500" />
                  <span>Add</span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${createDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {createDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-lg">
                    <button
                      onClick={() => { navigate('/deal-pipeline'); setCreateDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors"
                    >
                      <CatalystIcon className="w-5 h-5 text-gray-400 group-hover:text-[#064771]" />
                      Add Deal
                    </button>
                    <button
                      onClick={() => { navigate('/prospects/add-investor'); setCreateDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors"
                    >
                      <ProspectsIcon className="w-5 h-5 text-gray-400 group-hover:text-[#064771]" />
                      Add Investor
                    </button>
                    <button
                      onClick={() => { navigate('/prospects/add-target'); setCreateDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors"
                    >
                      <ProspectsIcon className="w-5 h-5 text-gray-400 group-hover:text-[#064771]" />
                      Add Target
                    </button>
                    <button
                      onClick={() => { navigate('/settings/staff'); setCreateDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors"
                    >
                      <StaffAccountsIcon className="w-5 h-5 text-gray-400 group-hover:text-[#064771]" />
                      Add Staff
                    </button>
                    <button
                      onClick={() => { navigate('/settings/partners'); setCreateDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors"
                    >
                      <PartnerIconCustom className="w-5 h-5 text-gray-400 group-hover:text-[#064771]" />
                      Add Partner
                    </button>
                    <button
                      onClick={() => { navigate('/settings/currency'); setCreateDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors"
                    >
                      <CurrencyIcon className="w-5 h-5 text-gray-400 group-hover:text-[#064771]" />
                      Add Currency
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Search Icon */}
            <button
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded"
              onClick={() => setSearchOpen(true)}
              title="Search"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notification Icon */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-1.5 p-2 hover:bg-gray-100 rounded relative transition-colors text-gray-500"
                onClick={() => setIsOpen(!isOpen)}
              >
                {unreadCount > 0 ? (
                  <>
                    <NotificationTrueIcon className="w-8 h-8 text-[#064771]" />
                    <span className="text-base font-medium text-[#064771]">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  </>
                ) : (
                  <NotificationFalseIcon className="w-8 h-8 text-gray-500" />
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded border border-gray-100 py-1 max-h-[400px] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200 shadow-lg scrollbar-premium">
                  <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-medium text-gray-700 text-sm">{t('header.notifications')}</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        className="text-xs text-[#064771] hover:text-[#085a8f] font-medium flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> {t('header.markAllRead')}
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        {t('header.noNotifications')}
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read_at ? "bg-blue-50/40" : ""
                            }`}
                          onClick={() =>
                            handleNotificationClick(
                              notification.id,
                              notification.data.link
                            )
                          }
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm ${!notification.read_at ? 'font-medium text-[#064771]' : 'font-medium text-gray-700'}`}>
                              {notification.data.title}
                            </h4>
                            {!notification.read_at && (
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {notification.data.message}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t bg-gray-50 text-center">
                    <button
                      onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                      className="text-xs text-[#064771] hover:text-[#085a8f] font-medium"
                    >
                      {t('header.viewAll')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block" />

            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Global Search Modal Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-6 md:p-20 scrollbar-premium">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={closeSearch} />

          <div className="mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden rounded bg-white ring-1 ring-black ring-opacity-5 transition-all">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm outline-none"
                placeholder={isPartner ? "Search by project code..." : "Search deals, companies, documents..."}
                autoFocus
              />
              <div className="absolute right-3 top-3.5 flex items-center gap-1">
                {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin mr-2" />}
                <button
                  onClick={closeSearch}
                  className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded hover:bg-gray-200"
                >
                  ESC
                </button>
              </div>
            </div>


            {/* Search Results */}
            {(query.length > 1 && results) ? (
              <div className="max-h-[60vh] overflow-y-auto py-2 scrollbar-premium">
                {/* Empty State */}
                {(!results.deals.length && !results.investors.length && !results.targets.length && !results.staff.length && !results.partners.length && !results.documents.length) && (
                  <div className="py-14 px-6 text-center text-sm sm:px-14">
                    <p className="mt-2 text-gray-500">No results found for &quot;{query}&quot;.</p>
                  </div>
                )}

                {/* Deals — hidden for partners */}
                {!isPartner && results.deals.length > 0 && (
                  <div key="deals-section">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">Deals</div>
                    <ul className="py-2 text-sm text-gray-700">
                      {results.deals.map((deal) => (
                        <li key={`deal-${deal.id}`} className="group flex cursor-pointer select-none items-center px-4 py-2.5 hover:bg-gray-100" onClick={() => { navigate('/deal-pipeline'); closeSearch(); }}>
                          <SearchAvatar name={deal.name} avatarUrl={deal.avatar_url as string | undefined} />
                          <span className="ml-3 flex-auto truncate">{deal.name}</span>
                          {deal.status && <span className="ml-3 flex-none text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-[3px]">{deal.status}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prospects: Investors */}
                {results.investors.length > 0 && (
                  <div key="investors-section">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">Investors</div>
                    <ul className="py-2 text-sm text-gray-700">
                      {results.investors.map((investor) => (
                        <li key={`investor-${investor.id}`} className="group flex cursor-pointer select-none items-center px-4 py-2.5 hover:bg-gray-100"
                          onClick={() => { navigate(`/prospects/investor/${investor.id}`); closeSearch(); }}>
                          <SearchAvatar name={investor.name} avatarUrl={investor.avatar_url as string | undefined} />
                          <span className="ml-3 flex-auto truncate">{isPartner ? investor.project_code : investor.name}</span>
                          {investor.project_code && !isPartner && <span className="ml-3 flex-none text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-[3px]">{investor.project_code}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prospects: Targets */}
                {results.targets.length > 0 && (
                  <div key="targets-section">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">Targets</div>
                    <ul className="py-2 text-sm text-gray-700">
                      {results.targets.map((target) => (
                        <li key={`target-${target.id}`} className="group flex cursor-pointer select-none items-center px-4 py-2.5 hover:bg-gray-100"
                          onClick={() => { navigate(`/prospects/target/${target.id}`); closeSearch(); }}>
                          <SearchAvatar name={target.name} avatarUrl={target.avatar_url as string | undefined} />
                          <span className="ml-3 flex-auto truncate">{isPartner ? target.project_code : target.name}</span>
                          {target.project_code && !isPartner && <span className="ml-3 flex-none text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-[3px]">{target.project_code}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Staff — hidden for partners */}
                {!isPartner && results.staff.length > 0 && (
                  <div key="staff-section">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">Staff</div>
                    <ul className="py-2 text-sm text-gray-700">
                      {results.staff.map((employee) => (
                        <li key={`staff-${employee.id}`} className="group flex cursor-pointer select-none items-center px-4 py-2.5 hover:bg-gray-100"
                          onClick={() => { navigate(`/employee/details/${employee.id}`); closeSearch(); }}>
                          <SearchAvatar firstName={employee.first_name} lastName={employee.last_name} avatarUrl={employee.avatar_url as string | undefined} />
                          <span className="ml-3 flex-auto truncate">{employee.first_name} {employee.last_name}</span>
                          {employee.work_email && <span className="ml-3 flex-none text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-[3px] truncate max-w-[180px]">{employee.work_email}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Partners — hidden for partners */}
                {!isPartner && results.partners.length > 0 && (
                  <div key="partners-section">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">Partners</div>
                    <ul className="py-2 text-sm text-gray-700">
                      {results.partners.map((partner) => (
                        <li key={`partner-${partner.id}`} className="group flex cursor-pointer select-none items-center px-4 py-2.5 hover:bg-gray-100"
                          onClick={() => { navigate(`/settings/partners`); closeSearch(); }}>
                          <SearchAvatar name={partner.name} avatarUrl={partner.avatar_url as string | undefined} />
                          <span className="ml-3 flex-auto truncate">{partner.name}</span>
                          {partner.partner_id && <span className="ml-3 flex-none text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-[3px]">{partner.partner_id}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Documents — hidden for partners */}
                {!isPartner && results.documents.length > 0 && (
                  <div key="documents-section">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">Documents</div>
                    <ul className="py-2 text-sm text-gray-700">
                      {results.documents.map((doc) => (
                        <li key={`doc-${doc.id}`} className="group flex cursor-pointer select-none items-center px-4 py-2.5 hover:bg-gray-100">
                          <div className="w-7 h-7 rounded-full flex-none flex items-center justify-center bg-gray-200">
                            <FileText className="h-3.5 w-3.5 text-gray-500" />
                          </div>
                          <span className="ml-3 flex-auto truncate">{doc.filename}</span>
                          {doc.size && <span className="ml-3 flex-none text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-[3px]">{Math.round(doc.size / 1024)} KB</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              // Default Empty State (Only show if query is empty)
              query.length <= 1 ? (
                <div className="py-14 px-6 text-center text-sm sm:px-14">
                  <Command className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-4 font-medium text-gray-900">{isPartner ? 'Search shared prospects' : 'Search the entire platform'}</p>
                  <p className="mt-2 text-gray-500">
                    {isPartner
                      ? 'Search for shared prospects by project code.'
                      : 'Search for active deals, buyer profiles, sellers, or documents.'
                    }
                  </p>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </>
  );
}
