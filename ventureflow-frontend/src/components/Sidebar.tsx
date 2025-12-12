import { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { menuItems } from "../config/menuItems";
import { Label } from "../assets/label";
import { AuthContext } from "../routes/AuthContext";

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
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r transition-all duration-300 z-30
        ${mobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
        }
        ${sidebarExpanded ? "w-64" : "w-16"}`}
    >
      <div className="relative h-full flex flex-col">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="p-2 hover:bg-gray-100 rounded-lg hidden md:block absolute -right-4 top-2 bg-white border shadow-sm z-50"
        >
          {sidebarExpanded ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Navigation Menu */}
        <nav className="flex-1 flex items-center justify-center overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <div className="space-y-1 w-full px-2 py-2">
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
                    className="w-full relative"
                    onMouseEnter={() => !sidebarExpanded && setExpandedMenu(item.label)}
                    onMouseLeave={() => !sidebarExpanded && setExpandedMenu(null)}
                  >
                    {/* Parent menu item */}
                    <div
                      className={`
                        flex items-center rounded-lg transition-all w-full px-2
                        ${sidebarExpanded && isActive
                          ? "bg-gray-200 text-gray-900"
                          : ""
                        }
                      `}
                    >
                      {/* Clickable icon+label that navigates to path */}
                      <Link
                        to={item.path || "/"}
                        className={`
                          flex items-center flex-1 cursor-pointer
                          ${!sidebarExpanded && isActive
                            ? "bg-gray-200 text-gray-900"
                            : ""
                          }
                        `}
                      >
                        <div
                          className={`
                            p-2 rounded-lg transition-colors
                            ${!isActive ? "text-gray-700 hover:bg-gray-100" : ""}
                          `}
                        >
                          <item.icon className="w-6 h-6 shrink-0" />
                        </div>

                        {/* Label - visible only when expanded */}
                        <span
                          className={`
                            transition-all duration-300 text-sm font-medium whitespace-nowrap ml-2
                            ${sidebarExpanded
                              ? "opacity-100"
                              : "opacity-0 w-0 overflow-hidden"
                            }
                          `}
                        >
                          <Label text={item.label} />
                        </span>
                      </Link>

                      {/* Chevron toggle for submenu - separate clickable area */}
                      {sidebarExpanded && (
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={`
                          p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer
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
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                        {item.subItems?.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className={`
                              flex items-center px-3 py-2 text-sm rounded-lg transition-colors
                              ${location.pathname === subItem.path
                                ? "bg-gray-200 text-gray-900 font-medium"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }
                            `}
                          >
                            {subItem.icon && (
                              <subItem.icon className="w-4 h-4 mr-2" />
                            )}
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Floating Submenu for Collapsed Sidebar */}
                    {!sidebarExpanded && expandedMenu === item.label && (
                      <div
                        className="absolute left-full top-0 ml-1 pl-1 z-50 min-w-[200px]"
                        onMouseEnter={() => setExpandedMenu(item.label)}
                        onMouseLeave={() => !sidebarExpanded && setExpandedMenu(null)}
                      >
                        <div className="bg-white border shadow-lg rounded-lg py-2 w-full">
                          <div className="px-4 py-2 text-sm font-semibold text-gray-900 border-b bg-gray-50">
                            {item.label}
                          </div>
                          {item.subItems?.map((subItem, subIndex) => (
                            <Link
                              key={subIndex}
                              to={subItem.path}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-[#064771] transition-colors"
                            >
                              {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={index}
                  to={item.path || "/"}
                  className={`
                    flex items-center rounded-lg transition-all w-full px-2
                    ${sidebarExpanded && isActive
                      ? "bg-gray-200 text-gray-900"
                      : ""
                    }
                  `}
                >
                  <div
                    className={`
                      p-2 rounded-lg transition-colors
                      ${!sidebarExpanded && isActive
                        ? "bg-gray-200 text-gray-900"
                        : ""
                      }
                      ${!isActive ? "text-gray-700 hover:bg-gray-100" : ""}
                    `}
                  >
                    <item.icon className="w-6 h-6 shrink-0" />
                  </div>

                  {/* Label - visible only when expanded */}
                  <span
                    className={`
                      transition-all duration-300 text-sm font-medium whitespace-nowrap ml-2
                      ${sidebarExpanded
                        ? "opacity-100"
                        : "opacity-0 w-0 overflow-hidden"
                      }
                    `}
                  >
                    <Label text={item.label} />
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
