import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { CurrencyIcon, SettingsIcon } from '../../assets/icons';
import { Users, ChevronLeft, ChevronRight, GitFork } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Redirect to general if on root settings page
  if (location.pathname === '/settings') {
    return <Navigate to="/settings/general" replace />;
  }

  const settingsMenu = [
    {
      label: t('navigation.general', 'General'),
      path: '/settings/general',
      icon: SettingsIcon,
    },
    {
      label: t('navigation.currency', 'Currency'),
      path: '/settings/currency',
      icon: CurrencyIcon,
    },
    {
      label: t('navigation.partnerManagement', 'Partner Management'),
      path: '/settings/partners',
      icon: Users,
    },
    {
      label: t('navigation.pipelineWorkflow', 'Pipeline Workflow'),
      path: '/settings/pipeline',
      icon: GitFork,
    },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FB] pt-16">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 flex-shrink-0 min-h-full transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div className={`p-6 flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : ''}`}>
          {!isCollapsed && (
            <h2 className="text-xl font-semibold text-[#064771] font-poppins">
              {t('navigation.settings', 'Settings')}
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-[#064771]"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        <nav className="px-3 space-y-1">
          {settingsMenu.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              title={isCollapsed ? item.label : ''}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors font-poppins
                ${isActive
                  ? 'bg-[#E6F0F6] text-[#064771]'
                  : 'text-gray-700 hover:bg-gray-50'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden bg-[#F8F9FB]">
        <div className="h-full w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Settings;
