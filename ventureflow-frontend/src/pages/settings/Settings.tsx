import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { CurrencyIcon, SettingsIcon } from '../../assets/icons';
import { Users, ChevronLeft, ChevronRight, GitFork, UserCog, History, User, DollarSign, Factory } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContext, useState } from 'react';
import { AuthContext } from '../../routes/AuthContext';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const auth = useContext(AuthContext);
  const isPartner = auth?.isPartner;
  const isAdmin = auth?.role === 'System Admin';

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Build the settings menu based on user type
  const getSettingsMenu = () => {
    if (isPartner) {
      // Partners only see General and their Profile
      return [
        {
          label: t('navigation.general', 'General'),
          path: '/settings/general',
          icon: SettingsIcon,
        },
        {
          label: t('profile.myProfile', 'My Profile'),
          path: '/settings/profile',
          icon: User,
        },
      ];
    }

    // Admin/Staff see full menu
    return [
      {
        label: t('navigation.general', 'General'),
        path: '/settings/general',
        icon: SettingsIcon,
      },
      {
        label: t('navigation.staffManagement', 'Staff & Accounts'),
        path: '/settings/staff',
        icon: UserCog,
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
      {
        label: t('navigation.industries', 'Industries'),
        path: '/settings/industries',
        icon: Factory,
      },
      {
        label: t('navigation.feeStructure', 'Fee Structure'),
        path: '/settings/fee-structure',
        icon: DollarSign,
      },
      // Audit Log - only visible to admins
      ...(isAdmin ? [{
        label: t('navigation.auditLog', 'Audit Log'),
        path: '/settings/audit-log',
        icon: History,
      }] : []),
    ];
  };

  const settingsMenu = getSettingsMenu();

  // Redirect to appropriate default page
  if (location.pathname === '/settings') {
    return <Navigate to="/settings/general" replace />;
  }

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 flex-shrink-0 min-h-full transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div className={`p-6 flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : ''}`}>
          {!isCollapsed && (
            <h2 className="text-2xl font-medium text-[#064771] ">
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
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
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
      <main className="flex-1 overflow-hidden bg-[#f9fafb]">
        <div className="h-full w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Settings;
