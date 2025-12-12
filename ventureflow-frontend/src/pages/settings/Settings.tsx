import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { CurrencyIcon, SettingsIcon } from '../../assets/icons';

const Settings: React.FC = () => {
  const location = useLocation();

  // Redirect to currency if on root settings page
  if (location.pathname === '/settings') {
    return <Navigate to="/settings/currency" replace />;
  }

  const settingsMenu = [
    {
      label: 'General',
      path: '/settings/general', // Placeholder or future route
      icon: SettingsIcon,
      disabled: true
    },
    {
      label: 'Currency',
      path: '/settings/currency',
      icon: CurrencyIcon,
    },
    // Add more settings items here like 'Users', 'Roles', etc.
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FB] pt-16">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 min-h-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-[#064771] font-poppins">Settings</h2>
          <p className="text-xs text-gray-500 mt-1 font-poppins">Manage system configurations</p>
        </div>
        <nav className="px-3 space-y-1">
          {settingsMenu.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={(e) => item.disabled && e.preventDefault()}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors font-poppins
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isActive
                  ? 'bg-[#E6F0F6] text-[#064771]'
                  : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Settings;
