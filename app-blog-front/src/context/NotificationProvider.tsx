"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';

type NotificationItem = {
  id: number;
  user_id: number;
  actor_id?: number | null;
  actor_username?: string | null;
  actor_photo_url?: string | null;
  type: string;
  article_id?: number | null;
  article_title?: string | null;
  article_thumbnail_url?: string | null;
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
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {'Content-Type': 'application/json'}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch('http://localhost:5000/notifications', { 
        headers,
        credentials: 'include' 
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data);
      // keep unreadCount in sync
      const un = data.filter((n: NotificationItem) => !n.is_read).length;
      setUnreadCount(un);
    } catch (e) {
      console.error('fetch notifications error', e);
    }
  };

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {'Content-Type': 'application/json'}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch('http://localhost:5000/notifications/unread_count', { 
        headers,
        credentials: 'include' 
      });
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unread || 0);
    } catch (e) {
      console.error('fetch unread count error', e);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // initial load of full notifications
    fetchNotifications();
    // lightweight polling for unread count
    const id = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

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

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh: fetchNotifications, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
