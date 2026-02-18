import React, { useState, useContext } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Target, LogOut, ChevronLeft, ChevronRight, Settings, User } from 'lucide-react';
import api from '../config/api';
import { AuthContext } from '../routes/AuthContext';

const PartnerLayout: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useContext(AuthContext);

    const handleLogout = async () => {
        try {
            await api.post('/api/logout');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            navigate('/login');
            window.location.reload(); // Force reload to clear state
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const navItems = [
        { path: '/partner-portal', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/partner-portal/investors', label: 'Shared Investors', icon: Users },
        { path: '/partner-portal/targets', label: 'Shared Targets', icon: Target },
        { path: '/partner-portal/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-[#F8F9FB] font-raleway">
            {/* Sidebar */}
            <aside
                className={`bg-[#064771] text-white flex-shrink-0 min-h-full transition-all duration-300 ease-in-out flex flex-col
                ${isCollapsed ? 'w-20' : 'w-64'}
                `}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-center border-b border-white/10 relative">
                    {!isCollapsed ? (
                        <h1 className="text-xl font-medium tracking-wider">VENTURE<span className="font-normal">FLOW</span></h1>
                    ) : (
                        <h1 className="text-xl font-medium">VF</h1>
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white text-[#064771] p-1 rounded-full shadow-md border border-gray-100 hover:scale-110 transition-transform z-10"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-premium">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.exact
                            ? location.pathname === item.path
                            : location.pathname.startsWith(item.path);

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`
                                    flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-white/10 text-white shadow-sm font-medium'
                                        : 'text-blue-100 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                <div className={`p-1 rounded-lg transition-colors ${isActive ? 'text-white' : 'text-blue-200 group-hover:text-white'}`}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                {!isCollapsed && (
                                    <span className="ml-3 text-sm tracking-wide truncate">
                                        {item.label}
                                    </span>
                                )}
                                {isCollapsed && isActive && (
                                    <div className="absolute left-16 bg-[#002845] text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer / Profile */}
                <div className="bg-[#003355] p-4">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        {!isCollapsed && (
                            <div className="flex items-center gap-3 overflow-hidden" onClick={() => navigate('/partner-portal/settings')} role="button">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium ring-2 ring-white/20">
                                    {auth?.user?.name?.charAt(0).toUpperCase() || 'P'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{auth?.user?.name || 'Partner'}</p>
                                    <p className="text-[10px] text-blue-300 truncate">{auth?.user?.email || 'Partner Portal'}</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleLogout}
                            className={`
                                p-2 hover:bg-white/10 rounded-lg text-blue-200 hover:text-red-300 transition-colors
                                ${!isCollapsed ? '' : 'w-full flex justify-center'}
                            `}
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FB] relative">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-8 shadow-sm z-10">
                    <h2 className="text-xl font-medium text-gray-900">
                        {navItems.find(i => location.pathname === i.path || (location.pathname.startsWith(i.path) && !i.exact))?.label || 'Partner Portal'}
                    </h2>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/partner-portal/settings')}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#064771] transition-colors p-2 hover:bg-gray-50 rounded-lg"
                        >
                            <User className="w-4 h-4" />
                            <span>My Profile</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto scrollbar-premium">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default PartnerLayout;

