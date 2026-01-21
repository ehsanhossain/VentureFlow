import { useRef, useState, useEffect } from "react";
import { Menu, X, Check, Bell, Search, Command, Loader2, FileText, Building, User, Briefcase, Home, Plus, ChevronDown } from "lucide-react";
import ProfileDropdown from "../components/dashboard/ProfileDropdown";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../config/api";

interface HeaderProps {
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  sidebarExpanded: boolean;
}

interface SearchResults {
  deals: any[];
  companies: any[];
  documents: any[];
  contacts: any[];
}

export function Header({ mobileMenuOpen, toggleMobileMenu, sidebarExpanded }: HeaderProps) {
  const { t } = useTranslation();
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
        } else {
          navigate(-1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true);
        try {
          const response = await api.get('/api/search', { params: { query } });
          setResults(response.data);
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
      <header className={`h-16 bg-white border-b border-gray-200 fixed top-0 right-0 z-40 transition-all duration-300
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
              <Link to="/" className="text-gray-400 hover:text-[#064771] transition-all p-1.5 hover:bg-gray-100 rounded-md">
                <Home className="w-4 h-4" />
              </Link>

              <div className="flex items-center overflow-hidden max-w-[400px]">
                {pathSegments.length > 3 && (
                  <span className="flex items-center text-gray-400 px-1">
                    <span className="mx-1 text-gray-300">/</span>
                    <span className="text-xs">...</span>
                  </span>
                )}

                {pathSegments.slice(-3).map((segment, index) => {
                  const url = `/${pathSegments.slice(0, pathSegments.length - 3 + index + 1).join('/')}`;
                  const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
                  const isLast = (pathSegments.length - 3 + index) === pathSegments.length - 1;

                  return (
                    <span key={segment} className="flex items-center group">
                      <span className="mx-1 text-gray-300">/</span>
                      <Link
                        to={url}
                        className={`px-2 py-1 rounded-md transition-all truncate max-w-[120px] ${isLast
                          ? "text-[#064771] bg-blue-50/50 font-bold"
                          : "text-gray-500 hover:text-[#064771] hover:bg-gray-50"
                          }`}
                        title={name}
                      >
                        {name === 'Employee' ? 'HRVC' : name}
                      </Link>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-auto lg:ml-8 relative">
              <div
                className="w-full flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-text hover:border-gray-300 transition-colors group"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-500 mr-3" />
                <span className="text-sm text-gray-400 group-hover:text-gray-500 flex-1 text-left">
                  Search deals, companies, documents...
                </span>
                <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-medium text-gray-400">
                  <span className="text-xs">⌘</span> K
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Create + Notifications + Profile */}
          <div className="flex items-center gap-3">

            {/* Create Button (Desktop) */}
            <div className="relative hidden md:block" ref={createDropdownRef}>
              <button
                onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-bold shadow-sm"
              >
                <Plus className="w-4 h-4 text-gray-500" />
                <span>Create</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${createDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {createDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => { navigate('/prospects/add-investor'); setCreateDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771]"
                  >
                    Create Investor
                  </button>
                  <button
                    onClick={() => { navigate('/seller-portal/add'); setCreateDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771]"
                  >
                    Create Seller
                  </button>
                  <button
                    onClick={() => { navigate('/deal-pipeline'); setCreateDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771]"
                  >
                    New Deal
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Search Icon */}
            <button
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notification Icon */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg relative transition-colors text-gray-500"
                onClick={() => setIsOpen(!isOpen)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 py-1 max-h-[400px] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-700 text-sm">{t('header.notifications')}</h3>
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
                            <h4 className={`text-sm ${!notification.read_at ? 'font-semibold text-[#064771]' : 'font-medium text-gray-700'}`}>
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
        <div className="fixed inset-0 z-[60] overflow-y-auto p-4 sm:p-6 md:p-20">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={closeSearch} />

          <div className="mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm outline-none"
                placeholder="Search deals, companies, documents..."
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
              <div className="max-h-[60vh] overflow-y-auto py-2">
                {/* Empty State */}
                {(!results.deals.length && !results.companies.length && !results.documents.length && !results.contacts.length) && (
                  <div className="py-14 px-6 text-center text-sm sm:px-14">
                    <p className="mt-2 text-gray-500">No results found for "{query}".</p>
                  </div>
                )}

                {/* Deals */}
                {results.deals.length > 0 && (
                  <div key="deals-section">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">Deals</div>
                    <ul className="py-2 text-sm text-gray-700">
                      {results.deals.map((deal) => (
                        <li key={`deal-${deal.id}`} className="group flex cursor-pointer select-none items-center px-4 py-2 hover:bg-gray-100" onClick={() => { navigate('/deal-pipeline'); closeSearch(); }}>
                          <Briefcase className="h-4 w-4 flex-none text-gray-400 group-hover:text-gray-500" />
                          <span className="ml-3 flex-auto truncate">{deal.name}</span>
                          <span className="ml-3 flex-none text-xs text-gray-400">{deal.status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Companies */}
                {results.companies.length > 0 && (
                  <div key="companies-section">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">Companies</div>
                    <ul className="py-2 text-sm text-gray-700">
                      {results.companies.map((company) => (
                        <li key={`company-${company.id}-${company.type}`} className="group flex cursor-pointer select-none items-center px-4 py-2 hover:bg-gray-100"
                          onClick={() => { navigate(company.type === 'Seller' ? `/seller-portal/view/${company.id}` : `/prospects/investor/${company.id}`); closeSearch(); }}>
                          <Building className="h-4 w-4 flex-none text-gray-400 group-hover:text-gray-500" />
                          <span className="ml-3 flex-auto truncate">{company.name}</span>
                          <span className="ml-3 flex-none text-xs text-gray-400">{company.type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contacts */}
                {results.contacts.length > 0 && (
                  <div key="contacts-section">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">Contacts</div>
                    <ul className="py-2 text-sm text-gray-700">
                      {results.contacts.map((contact) => (
                        <li key={`contact-${contact.id}`} className="group flex cursor-pointer select-none items-center px-4 py-2 hover:bg-gray-100"
                          onClick={() => { navigate(`/employee/details/${contact.id}`); closeSearch(); }}>
                          <User className="h-4 w-4 flex-none text-gray-400 group-hover:text-gray-500" />
                          <span className="ml-3 flex-auto truncate">{contact.first_name} {contact.last_name}</span>
                          <span className="ml-3 flex-none text-xs text-gray-400">{contact.work_email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Documents */}
                {results.documents.length > 0 && (
                  <div key="documents-section">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">Documents</div>
                    <ul className="py-2 text-sm text-gray-700">
                      {results.documents.map((doc) => (
                        <li key={`doc-${doc.id}`} className="group flex cursor-pointer select-none items-center px-4 py-2 hover:bg-gray-100">
                          <FileText className="h-4 w-4 flex-none text-gray-400 group-hover:text-gray-500" />
                          <span className="ml-3 flex-auto truncate">{doc.filename}</span>
                          <span className="ml-3 flex-none text-xs text-gray-400">{doc.size ? Math.round(doc.size / 1024) + ' KB' : ''}</span>
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
                  <p className="mt-4 font-semibold text-gray-900">Search the entire platform</p>
                  <p className="mt-2 text-gray-500">
                    Search for active deals, buyer profiles, sellers, or documents.
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
