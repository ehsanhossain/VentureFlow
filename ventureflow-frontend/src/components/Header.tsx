import React, { useRef, useState, useEffect } from "react";
import { Menu, X, Check } from "lucide-react";
import Logo from "../assets/logo";
import LanguageSelect from "../components/dashboard/LanguageSelect";
import { BellIcon } from "../assets/icons";
import ProfileDropdown from "../components/dashboard/ProfileDropdown";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

export function Header({ mobileMenuOpen, toggleMobileMenu }: HeaderProps) {
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: string, link?: string) => {
    await markAsRead(id);
    setIsOpen(false);
    if (link) {
      navigate(link);
    }
  };

  return (
    <header className="h-16 bg-[#064771] border-b fixed top-0 left-0 right-0 z-40">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-lg text-white lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <div className="ml-0 lg:ml-[95px]">
            <Logo />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Icon & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="p-2 hover:bg-[#053a5c] rounded-lg relative transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#064771]"></span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 py-1 max-h-[400px] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-semibold text-gray-700">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs text-[#064771] hover:text-[#085a8f] font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No notifications yet
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
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <LanguageSelect />

          <div className="flex items-center gap-3">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
