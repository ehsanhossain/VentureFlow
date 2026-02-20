/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { Check, CheckCheck, RefreshCw, Trash2, Users, Bell, CheckCircle } from "lucide-react";
import api from "../../config/api";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../components/Alert";

// ─── Module Icons — actual SVG assets from the project ──────────────
import dealsPipelineIcon from "../../assets/icons/deals-pipeline.svg";
import addInvestorIcon from "../../assets/icons/prospects/addinvestor.svg";
import addTargetIcon from "../../assets/icons/prospects/addtarget.svg";
import matchingModuleIcon from "../../assets/icons/matching-module.svg";

// Get the right icon for a notification based on entity type
const getModuleIcon = (entityType: string, type: string): { src?: string; lucide?: React.ElementType } => {
    if (type === 'deal' || entityType === 'deal' || entityType === 'deadline') return { src: dealsPipelineIcon };
    if (entityType === 'buyer' || entityType === 'investor') return { src: addInvestorIcon };
    if (entityType === 'seller' || entityType === 'target') return { src: addTargetIcon };
    if (entityType === 'match') return { src: matchingModuleIcon };
    if (entityType === 'partner') return { lucide: Users };
    return { lucide: Bell };
};

// Format relative time — compact style matching the Figma ("15m ago")
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

// Generate a deterministic avatar color from name
const getAvatarColor = (name: string) => {
    const colors = [
        'bg-blue-100 text-blue-700',
        'bg-amber-100 text-amber-700',
        'bg-emerald-100 text-emerald-700',
        'bg-purple-100 text-purple-700',
        'bg-rose-100 text-rose-700',
        'bg-cyan-100 text-cyan-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

export default function NotificationsPage() {
    const { refreshNotifications, markAsRead, markAllAsRead } = useNotifications();
    const [allNotifications, setAllNotifications] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const navigate = useNavigate();

    const fetchPage = useCallback(async (pageNumber: number) => {
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
    }, []);

    useEffect(() => {
        fetchPage(1);
    }, [fetchPage]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPage(nextPage);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshNotifications();
        await fetchPage(1);
        setPage(1);
        setIsRefreshing(false);
    };

    const handleClick = async (notification: any) => {
        if (!notification.read_at) {
            await markAsRead(notification.id);
            setAllNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)
            );
        }

        if (notification.data.link) {
            const entityType = notification.data.entity_type;
            const entityId = notification.data.entity_id;

            if (entityId && entityType) {
                try {
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
                    navigate(notification.data.link);
                } catch (error: any) {
                    if (error.response?.status === 404) {
                        showAlert({
                            type: 'warning',
                            message: `This ${entityType || 'item'} no longer exists. It may have been deleted.`
                        });
                        setAllNotifications(prev => prev.filter(n => n.id !== notification.id));
                    } else {
                        navigate(notification.data.link);
                    }
                }
            } else {
                navigate(notification.data.link);
            }
        }
    };

    const handleMarkAsRead = async (e: React.MouseEvent, notification: any) => {
        e.stopPropagation();
        if (!notification.read_at) {
            await markAsRead(notification.id);
            setAllNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)
            );
        }
    };

    const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        try {
            await api.delete(`/api/notifications/${notificationId}`);
            setAllNotifications(prev => prev.filter(n => n.id !== notificationId));
            showAlert({ type: 'success', message: 'Notification deleted' });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const totalCount = allNotifications.length;
    const readCount = totalCount - unreadCount;

    // ─── Tab definitions ───
    const tabs = [
        { key: 'all' as const, label: 'All', count: totalCount },
        { key: 'unread' as const, label: 'Unread', count: unreadCount },
        { key: 'read' as const, label: 'Read', count: readCount },
    ];

    // Index for sliding pill position
    const activeTabIndex = tabs.findIndex(t => t.key === filter);

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* ─── Header ──────────────────────────────────────── */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-white">
                <div className="px-6 lg:px-8 py-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Left: Title + Tabs */}
                        <div className="flex items-center gap-5 flex-wrap">
                            <h1 className="text-base font-medium text-gray-900">
                                Notification Center
                            </h1>

                            {/* Filter Tabs — Prospect-style sliding pill */}
                            <div className="relative flex bg-gray-100 rounded-[3px] p-1" style={{ minWidth: '280px' }}>
                                {/* Sliding pill background */}
                                <div
                                    className="absolute top-1 bottom-1 rounded-[3px] bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                    style={{
                                        width: `calc(${100 / tabs.length}% - ${8 / tabs.length}px)`,
                                        left: `calc(${(activeTabIndex * 100) / tabs.length}% + 4px)`,
                                    }}
                                />
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setFilter(tab.key)}
                                        className={`relative z-[1] px-5 py-1.5 rounded-[3px] text-sm font-medium transition-colors duration-300 cursor-pointer text-center ${filter === tab.key
                                            ? 'text-[#064771]'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                        style={{ minWidth: '80px', flex: '1 1 0%' }}
                                    >
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className="ml-1 opacity-60">({tab.count})</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-[3px] hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 cursor-pointer"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={async () => { await markAllAsRead(); fetchPage(1); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded-[3px] hover:bg-[#053a5c] transition-colors text-sm font-medium cursor-pointer"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Content ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto scrollbar-premium">
                <div className="px-6 lg:px-8 py-5">
                    {/* Summary text */}
                    {unreadCount > 0 && (
                        <p className="text-sm text-gray-500 mb-5">
                            You have <span className="text-[#064771] font-semibold">{unreadCount} Notification{unreadCount !== 1 ? 's' : ''}</span> since you left
                        </p>
                    )}

                    {/* ─── Notification List ───────────────────────── */}
                    {filteredNotifications.length === 0 ? (
                        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 220px)', width: '100%' }}>
                            <div className="text-center">
                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium text-sm">No notifications</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {filter === 'unread' ? "You're all caught up!" : "Nothing to show here."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {filteredNotifications.map((notification) => {
                                const entityType = notification.data.entity_type || '';
                                const type = notification.data.type || '';
                                const isUnread = !notification.read_at;
                                const moduleIcon = getModuleIcon(entityType, type);
                                const actorName = notification.data.actor_name || notification.data.triggered_by || '';

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleClick(notification)}
                                        className={`
                                            group flex justify-between items-end px-4 py-2 rounded-[3px]
                                            cursor-pointer transition-all duration-150
                                            ${isUnread ? 'bg-[#EEFAFF]' : 'bg-white hover:bg-gray-50'}
                                            hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)]
                                        `}
                                    >
                                        {/* Left content */}
                                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                                            {/* Row 1: Icon + Title + Avatar + Actor */}
                                            <div className="flex items-center gap-3">
                                                {/* Module icon */}
                                                {moduleIcon.src ? (
                                                    <img
                                                        src={moduleIcon.src}
                                                        alt=""
                                                        className="w-5 h-5 flex-shrink-0"
                                                    />
                                                ) : moduleIcon.lucide ? (
                                                    <moduleIcon.lucide className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                                ) : null}

                                                {/* Title */}
                                                <span className="text-sm font-semibold text-gray-900 leading-5">
                                                    {notification.data.title}
                                                </span>

                                                {/* Avatar + Actor name */}
                                                {actorName && (
                                                    <div className="flex items-center gap-2">
                                                        {notification.data.actor_avatar ? (
                                                            <img
                                                                src={notification.data.actor_avatar}
                                                                alt={actorName}
                                                                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold flex-shrink-0 ${getAvatarColor(actorName)}`}>
                                                                {actorName.split(' ').map((w: string) => w[0]).join('').toUpperCase().substring(0, 2)}
                                                            </div>
                                                        )}
                                                        <span className="text-xs text-gray-500 leading-5 whitespace-nowrap">
                                                            {actorName}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Row 2: Description — entity names are bold */}
                                            <div className="h-[21px] relative overflow-hidden">
                                                <p className="text-xs text-gray-500 leading-5 truncate">
                                                    {(() => {
                                                        const msg = notification.data.message || '';
                                                        const entities: string[] = notification.data.entities || [];
                                                        if (entities.length === 0) return msg;

                                                        // Build a regex matching any entity name in the message
                                                        const escaped = entities.map((e: string) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                                                        const regex = new RegExp(`(${escaped.join('|')})`, 'g');
                                                        const parts = msg.split(regex);

                                                        return parts.map((part: string, i: number) =>
                                                            entities.includes(part)
                                                                ? <span key={i} className="font-medium text-gray-700">{part}</span>
                                                                : <React.Fragment key={i}>{part}</React.Fragment>
                                                        );
                                                    })()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right side: Actions + Time */}
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            {/* Mark as read — hover only, unread only */}
                                            {isUnread && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(e, notification)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-[3px] hover:bg-blue-50 text-gray-300 hover:text-[#064771] transition-all cursor-pointer"
                                                    title="Mark as read"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </button>
                                            )}

                                            {/* Delete — hover only */}
                                            <button
                                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-[3px] hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all cursor-pointer"
                                                title="Delete notification"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Timestamp */}
                                            <span className="text-xs text-gray-400 leading-4 whitespace-nowrap min-w-[48px] text-right">
                                                {formatRelativeTime(notification.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Load More */}
                    {hasMore && filteredNotifications.length > 0 && (
                        <div className="mt-5 text-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="px-6 py-2 text-sm text-gray-500 hover:text-[#064771] bg-white border border-gray-200 rounded-[3px] hover:border-[#064771]/30 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? 'Loading...' : 'Load more notifications'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
