import React, { useEffect, useState } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { Check, CheckCheck, Clock, Search } from "lucide-react";
import api from "../../config/api";
import { useNavigate } from "react-router-dom";

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
            // Update local state
            setAllNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n));
        }

        if (notification.data.link) {
            navigate(notification.data.link);
        }
    };

    const filteredNotifications = allNotifications.filter(n => {
        if (filter === 'unread') return n.read_at === null;
        if (filter === 'read') return n.read_at !== null;
        return true;
    });

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#064771]">Notification Center</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and view all your system alerts.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => { await markAllAsRead(); fetchPage(1); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-[#064771] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all as read
                    </button>
                    <button
                        onClick={() => { refreshNotifications(); fetchPage(1); }}
                        className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                        title="Refresh"
                    >
                        <Clock className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
                {['all', 'unread', 'read'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${filter === f
                            ? 'border-[#064771] text-[#064771]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-gray-300" />
                        </div>
                        <p>No notifications found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleClick(notification)}
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-4 ${!notification.read_at ? 'bg-blue-50/30' : ''
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full mt-2.5 flex-shrink-0 ${!notification.read_at ? 'bg-blue-500' : 'bg-gray-200'
                                    }`} />

                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1">
                                        <h3 className={`text-sm ${!notification.read_at ? 'font-bold text-[#064771]' : 'font-medium text-gray-800'}`}>
                                            {notification.data.title}
                                        </h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {notification.data.message}
                                    </p>
                                    {notification.data.type && (
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] uppercase tracking-wider rounded">
                                            {notification.data.type}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Load More */}
            {hasMore && (
                <div className="mt-6 text-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="text-sm text-gray-500 hover:text-[#064771] font-medium disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Load older notifications'}
                    </button>
                </div>
            )}
        </div>
    );
}
