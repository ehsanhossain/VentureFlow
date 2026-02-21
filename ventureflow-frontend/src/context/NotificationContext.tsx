/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../config/api';

export interface NotificationItem {
    id: string;
    type: string;
    notifiable_type: string;
    data: {
        title: string;
        message: string;
        link?: string;
        entity_id?: string;
        entity_type?: string;
        type?: string;
        actor_name?: string;
        triggered_by?: string;
    };
    read_at: string | null;
    created_at: string;
}

interface NotificationContextProps {
    notifications: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch count and latest notifications
    const fetchNotifications = async () => {
        try {
            const [countRes, listRes] = await Promise.all([
                api.get('/api/notifications/unread-count'),
                api.get('/api/notifications?page=1'),
            ]);

            setUnreadCount(countRes.data.count);
            setNotifications(listRes.data.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/api/notifications/${id}/read`);
            // Optimistically update UI
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/api/notifications/mark-all-read');
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const refreshNotifications = async () => {
        setLoading(true);
        await fetchNotifications();
        setLoading(false);
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                markAsRead,
                markAllAsRead,
                refreshNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
