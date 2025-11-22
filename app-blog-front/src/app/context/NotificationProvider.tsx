"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type NotificationItem = {
  id: number;
  user_id: number;
  actor_id?: number | null;
  type: string;
  article_id?: number | null;
  comment_id?: number | null;
  reaction_type?: string | null;
  is_read: boolean;
  created_at: string;
};

type ContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
};

const NotificationContext = createContext<ContextValue | null>(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/notifications', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      // ignore network errors silently for now
      console.error('fetch notifications error', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 10000);
    return () => clearInterval(id);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/notifications/${id}/read`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (e) {
      console.error('mark as read error', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh: fetchNotifications, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
