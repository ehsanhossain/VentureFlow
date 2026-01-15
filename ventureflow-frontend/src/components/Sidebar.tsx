import { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { menuItems } from "../config/menuItems";
import { Label } from "../assets/label";
import { AuthContext } from "../routes/AuthContext";
import { useTranslation } from "react-i18next";
import Logo from "../assets/logo";
import LogoIcon from "../assets/logo-icon";

interface SidebarProps {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  mobileMenuOpen: boolean;
}

export function Sidebar({
  sidebarExpanded,
  setSidebarExpanded,
  mobileMenuOpen,
}: SidebarProps) {
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const context = useContext(AuthContext);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (context?.user as any)?.role;
  const { t } = useTranslation();

  const getTranslationKey = (label: string) => {
    const mapping: { [key: string]: string } = {
      "Dashboard": "navigation.dashboard",
      "Prospects": "navigation.companies",
      "Seller Register": "navigation.sellerRegister",
      "Buyer Register": "navigation.buyerRegister",
      "Deal Pipeline": "navigation.dealPipeline",
      "Employee": "navigation.employees",
      "Settings": "navigation.settings",
      "General": "navigation.general",
      "Currency": "navigation.currency",
      "Partner Management": "navigation.partnerManagement",
      "Pipeline Workflow": "navigation.pipelineWorkflow"
    };
    return mapping[label] || label;
  };

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const isSubItemActive = (subItems: any[]) => {
    return subItems.some((sub) => location.pathname === sub.path);
  };

  const toggleMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r transition-all duration-300 z-50
        ${mobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
        }
        ${sidebarExpanded ? "w-64" : "w-16"}`}
    >
      <div className="relative h-full flex flex-col">
        {/* Logo Area */}
        <div className={`flex items-center border-b border-gray-100 flex-shrink-0 relative h-16 ${sidebarExpanded ? 'justify-start px-6' : 'justify-center focus:outline-none'}`}>
          <Link to="/" className="text-[#064771] flex items-center justify-center transition-all duration-300 w-full h-full relative">
            {sidebarExpanded ? (
              <div className="w-40 animate-in fade-in duration-300 overflow-hidden flex items-center justify-start">
                <Logo />
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center animate-in zoom-in duration-300">
                <LogoIcon />
              </div>
            )}
          </Link>

          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-md shadow-sm hidden md:flex items-center justify-center transition-all duration-300 text-gray-500 hover:text-[#064771] hover:border-[#064771] z-50 focus:outline-none"
          >
            {sidebarExpanded ? (
              <ChevronLeft className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav
          className={`flex-1 flex flex-col py-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 ${!sidebarExpanded && 'overflow-y-visible'}`}
        >
          <div className="space-y-1 w-full px-2">
            {filteredMenuItems.map((item, index) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isActive =
                location.pathname === item.path ||
                (hasSubItems && isSubItemActive(item.subItems || []));
              const isExpanded = expandedMenu === item.label;

              if (hasSubItems) {
                return (
                  <div
                    key={index}
                    className="w-full relative group"
                    onMouseEnter={() => !sidebarExpanded && setExpandedMenu(item.label)}
                    onMouseLeave={() => !sidebarExpanded && setExpandedMenu(null)}
                  >
                    {/* Parent menu item */}
                    <div
                      className={`
                        flex items-center rounded-lg transition-all w-full px-2 my-0.5 relative
                        ${isActive && sidebarExpanded
                          ? "bg-blue-50 text-[#064771]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      {isActive && sidebarExpanded && (
                        <div className="absolute left-0 w-1.5 h-full py-2">
                          <div className="w-full h-full bg-[#064771] rounded-r-full"></div>
                        </div>
                      )}

                      {/* Clickable icon+label that navigates to path */}
                      <Link
                        to={item.path || "/"}
                        className="flex items-center flex-1 py-2 cursor-pointer outline-none pl-2"
                      >
                        <div className={`
                            flex items-center justify-center w-6 h-6 shrink-0 transition-colors
                            ${!sidebarExpanded && isActive ? "text-[#064771]" : ""}
                        `}>
                          <item.icon className="w-5 h-5" strokeWidth={1.5} />
                        </div>

                        {/* Label - visible only when expanded */}
                        <span
                          className={`
                            transition-all duration-300 text-sm font-medium whitespace-nowrap ml-3
                            ${sidebarExpanded
                              ? "opacity-100"
                              : "opacity-0 w-0 overflow-hidden"
                            }
                          `}
                        >
                          <Label text={t(getTranslationKey(item.label))} />
                        </span>
                      </Link>

                      {/* Chevron toggle for submenu - separate clickable area */}
                      {sidebarExpanded && (
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={`
                          p-1 rounded hover:bg-gray-200/50 transition-colors cursor-pointer mr-2
                          ${sidebarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
                        `}
                        >
                          <ChevronDown
                            className={`w-4 h-4 opacity-50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Sub-items - shown when expanded (Standard Sidebar) */}
                    {sidebarExpanded && isExpanded && (
                      <div className="ml-9 mt-1 space-y-1 mb-2">
                        {item.subItems?.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className={`
                              flex items-center px-3 py-2 text-sm rounded-lg transition-colors
                              ${location.pathname === subItem.path
                                ? "text-[#064771] font-medium bg-blue-50/50"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                              }
                            `}
                          >
                            {t(getTranslationKey(subItem.label))}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Floating Submenu for Collapsed Sidebar */}
                    {!sidebarExpanded && expandedMenu === item.label && (
                      <div
                        className="absolute left-full top-0 ml-2 pl-2 z-50 min-w-[200px]"
                        onMouseEnter={() => setExpandedMenu(item.label)}
                        onMouseLeave={() => !sidebarExpanded && setExpandedMenu(null)}
                      >
                        <div className="bg-white border border-gray-100 shadow-xl rounded-lg py-2 w-full animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-4 py-2 text-sm font-semibold text-gray-900 border-b border-gray-50 bg-gray-50/50">
                            {t(getTranslationKey(item.label))}
                          </div>
                          {item.subItems?.map((subItem, subIndex) => (
                            <Link
                              key={subIndex}
                              to={subItem.path}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#064771] transition-colors"
                            >
                              {subItem.icon && <subItem.icon className="w-4 h-4 mr-2 opacity-70" />}
                              {t(getTranslationKey(subItem.label))}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Simple Menu Item
              return (
                <div key={index} className="w-full relative group">
                  {/* Tooltip for collapsed state */}
                  {!sidebarExpanded && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                      {t(getTranslationKey(item.label))}
                    </div>
                  )}

                  <Link
                    to={item.path || "/"}
                    className={`
                        flex items-center rounded-lg transition-all w-full px-2 py-2 my-0.5 outline-none relative
                        ${isActive
                        ? sidebarExpanded ? "bg-blue-50 text-[#064771]" : "text-[#064771] bg-blue-50"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    {isActive && sidebarExpanded && (
                      <div className="absolute left-0 w-1.5 h-full py-2">
                        <div className="w-full h-full bg-[#064771] rounded-r-full"></div>
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-center w-6 h-6 shrink-0 ${isActive && sidebarExpanded ? "ml-2" : ""}`}
                    >
                      <item.icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>

                    {/* Label - visible only when expanded */}
                    <span
                      className={`
                        transition-all duration-300 text-sm font-medium whitespace-nowrap ml-3
                        ${sidebarExpanded
                          ? "opacity-100"
                          : "opacity-0 w-0 overflow-hidden"
                        }
                        `}
                    >
                      <Label text={t(getTranslationKey(item.label))} />
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
