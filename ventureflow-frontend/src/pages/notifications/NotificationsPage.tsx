import React, { useEffect, useState } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { Check, CheckCheck, RefreshCw, Bell, Users, Target, Briefcase, Handshake, AlertCircle, Trash2 } from "lucide-react";
import api from "../../config/api";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../components/Alert";

// Category icon mapping based on notification type
const getCategoryIcon = (entityType: string, type: string) => {
    const iconClass = "w-5 h-5";

    // Use entity_type for registration notifications
    if (entityType === 'buyer' || entityType === 'investor') {
        return <Users className={`${iconClass} text-blue-600`} />;
    }
    if (entityType === 'seller' || entityType === 'target') {
        return <Target className={`${iconClass} text-orange-600`} />;
    }
    if (entityType === 'partner') {
        return <Handshake className={`${iconClass} text-green-600`} />;
    }

    // Use type for other notifications
    if (type === 'deal') {
        return <Briefcase className={`${iconClass} text-purple-600`} />;
    }
    if (type === 'deadline') {
        return <AlertCircle className={`${iconClass} text-red-600`} />;
    }

    return <Bell className={`${iconClass} text-slate-500`} />;
};

// Get background color for icon container
const getIconBgColor = (entityType: string, type: string) => {
    if (entityType === 'buyer' || entityType === 'investor') return 'bg-blue-50';
    if (entityType === 'seller' || entityType === 'target') return 'bg-orange-50';
    if (entityType === 'partner') return 'bg-green-50';
    if (type === 'deal') return 'bg-purple-50';
    if (type === 'deadline') return 'bg-red-50';
    return 'bg-slate-50';
};

// Get category label
const getCategoryLabel = (entityType: string, type: string) => {
    if (entityType === 'buyer' || entityType === 'investor') return 'Investor';
    if (entityType === 'seller' || entityType === 'target') return 'Target';
    if (entityType === 'partner') return 'Partner';
    if (type === 'deal') return 'Deal';
    if (type === 'deadline') return 'Deadline';
    if (type === 'registration') return 'Registration';
    return 'System';
};

// Get category badge color
const getCategoryBadgeColor = (entityType: string, type: string) => {
    if (entityType === 'buyer' || entityType === 'investor') return 'bg-blue-100 text-blue-700';
    if (entityType === 'seller' || entityType === 'target') return 'bg-orange-100 text-orange-700';
    if (entityType === 'partner') return 'bg-green-100 text-green-700';
    if (type === 'deal') return 'bg-purple-100 text-purple-700';
    if (type === 'deadline') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
};

// Format relative time
const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationsPage() {
    const { refreshNotifications, markAsRead, markAllAsRead } = useNotifications();
    const [allNotifications, setAllNotifications] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();

    const fetchPage = async (pageNumber: number) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/notifications?page=${pageNumber}`);
            if (pageNumber === 1) {
                setAllNotifications(res.data.data);
            } else {
                setAllNotifications(prev => [...prev, ...res.data.data]);
            }
            setHasMore(res.data.meta.last_page > pageNumber);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPage(1);
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPage(nextPage);
    };

    const handleClick = async (notification: any) => {
        if (!notification.read_at) {
            await markAsRead(notification.id);
            setAllNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n));
        }

        if (notification.data.link) {
            // Check if the linked entity still exists before navigating
            const entityType = notification.data.entity_type;
            const entityId = notification.data.entity_id;

            if (entityId && entityType) {
                try {
                    // Determine the API endpoint based on entity type
                    let checkEndpoint = '';
                    if (entityType === 'buyer' || entityType === 'investor') {
                        checkEndpoint = `/api/buyer/${entityId}`;
                    } else if (entityType === 'seller' || entityType === 'target') {
                        checkEndpoint = `/api/seller/${entityId}`;
                    } else if (entityType === 'partner') {
                        checkEndpoint = `/api/partners/${entityId}`;
                    }

                    if (checkEndpoint) {
                        await api.get(checkEndpoint);
                    }

                    // Entity exists, navigate
                    navigate(notification.data.link);
                } catch (error: any) {
                    if (error.response?.status === 404) {
                        // Entity was deleted
                        showAlert({
                            type: 'warning',
                            message: `This ${entityType || 'item'} no longer exists. It may have been deleted.`
                        });
                        // Optionally remove the notification from local state
                        setAllNotifications(prev => prev.filter(n => n.id !== notification.id));
                    } else {
                        // Other error, still try to navigate
                        navigate(notification.data.link);
                    }
                }
            } else {
                // No entity to check, just navigate
                navigate(notification.data.link);
            }
        }
    };

    const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        try {
            await api.delete(`/api/notifications/${notificationId}`);
            setAllNotifications(prev => prev.filter(n => n.id !== notificationId));
            showAlert({ type: 'success', message: 'Notification deleted' });
        } catch (error) {
            showAlert({ type: 'error', message: 'Failed to delete notification' });
        }
    };

    const filteredNotifications = allNotifications.filter(n => {
        if (filter === 'unread') return n.read_at === null;
        if (filter === 'read') return n.read_at !== null;
        return true;
    });

    const unreadCount = allNotifications.filter(n => !n.read_at).length;

    return (
        <div className="h-full flex flex-col bg-[#f8fafc] overflow-hidden">
            {/* Header - Matching Prospects style */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#064771] to-[#0a5a8a] flex items-center justify-center shadow-sm">
                                <Bell className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-[#1e293b]">Notifications</h1>
                                <p className="text-sm text-slate-500">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { refreshNotifications(); fetchPage(1); }}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {unreadCount > 0 && (
                            <button
                                onClick={async () => { await markAllAsRead(); fetchPage(1); }}
                                className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded-lg hover:bg-[#053a5c] transition-colors text-sm font-medium"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs - Pill Style */}
                <div className="flex gap-1 mt-5 bg-slate-100 p-1 rounded-lg w-fit">
                    {[
                        { key: 'all', label: 'All', count: allNotifications.length },
                        { key: 'unread', label: 'Unread', count: unreadCount },
                        { key: 'read', label: 'Read', count: allNotifications.length - unreadCount }
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as any)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === f.key
                                ? 'bg-white text-[#064771] shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {f.label}
                            {f.count > 0 && (
                                <span className={`ml-1.5 text-xs ${filter === f.key ? 'text-[#064771]' : 'text-slate-400'}`}>
                                    ({f.count})
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {filteredNotifications.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">No notifications</p>
                            <p className="text-sm text-slate-400 mt-1">
                                {filter === 'unread' ? "You're all caught up!" : "Nothing to show here."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredNotifications.map((notification) => {
                                const entityType = notification.data.entity_type || '';
                                const type = notification.data.type || '';
                                const isUnread = !notification.read_at;

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleClick(notification)}
                                        className={`group p-4 hover:bg-slate-50 cursor-pointer transition-all flex gap-4 relative ${isUnread ? 'bg-blue-50/40' : ''
                                            }`}
                                    >
                                        {/* Category Icon */}
                                        <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${getIconBgColor(entityType, type)}`}>
                                            {getCategoryIcon(entityType, type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 mb-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className={`text-sm ${isUnread ? 'font-semibold text-[#1e293b]' : 'font-medium text-slate-700'}`}>
                                                        {notification.data.title}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full ${getCategoryBadgeColor(entityType, type)}`}>
                                                        {getCategoryLabel(entityType, type)}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                                                    {formatRelativeTime(notification.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-2">
                                                {notification.data.message}
                                            </p>
                                        </div>

                                        {/* Unread indicator */}
                                        {isUnread && (
                                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        )}

                                        {/* Delete button - appears on hover */}
                                        <button
                                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex-shrink-0"
                                            title="Delete notification"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Load More */}
                {hasMore && filteredNotifications.length > 0 && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={loading}
                            className="px-6 py-2 text-sm text-slate-500 hover:text-[#064771] bg-white border border-slate-200 rounded-lg hover:border-[#064771]/30 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Load more notifications'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
