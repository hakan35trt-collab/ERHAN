
import React, { useState, useEffect, useRef } from "react";
import { Notification } from "@/entities/Notification";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, CheckCheck, Trash2, MessageSquare, Megaphone, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { playNotificationSound } from "@/components/lib/sounds";

function showBrowserNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
      });
    } else {
      new window.Notification(title, { body, icon: '/icons/icon-192.png' });
    }
  } catch (e) {
    console.warn('Browser notification failed:', e);
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

export default function NotificationCenter({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const prevUnreadCountRef = useRef(0);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const userNotifications = await Notification.filter(
        { user_id: currentUser.id },
        '-created_date',
        30
      );

      const newUnreadCount = userNotifications.filter(n => !n.is_read).length;

      if (newUnreadCount > prevUnreadCountRef.current) {
        playNotificationSound();
        const newOnes = userNotifications
          .filter(n => !n.is_read)
          .slice(0, newUnreadCount - prevUnreadCountRef.current);
        newOnes.forEach(n => {
          showBrowserNotification(n.title || 'Yeni Bildirim', n.content || '');
        });
      }

      setNotifications(userNotifications);
      setUnreadCount(newUnreadCount);
      prevUnreadCountRef.current = newUnreadCount;
    } catch (error) {
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) return;
      console.error("Bildirimler yüklenemedi:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      prevUnreadCountRef.current = Math.max(0, prevUnreadCountRef.current - 1);
    } catch (error) {
      console.error("Bildirim okundu işaretlenemedi:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      for (const n of unread) {
        await Notification.update(n.id, { is_read: true });
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      prevUnreadCountRef.current = 0;
    } catch (error) {
      console.error("Tüm bildirimler okundu işaretlenemedi:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await Notification.delete(notificationId);
      const deleted = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        prevUnreadCountRef.current = Math.max(0, prevUnreadCountRef.current - 1);
      }
    } catch (error) {
      console.error("Bildirim silinemedi:", error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm("Tüm bildirimleri silmek istediğinizden emin misiniz?")) return;
    try {
      for (const n of notifications) await Notification.delete(n.id);
      setNotifications([]);
      setUnreadCount(0);
      prevUnreadCountRef.current = 0;
    } catch (error) {
      console.error("Bildirimler silinemedi:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) markAsRead(notification.id);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'announcement': return <Megaphone className="w-4 h-4 text-yellow-500" />;
      case 'points': return <Image className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationTypeText = (type) => {
    switch (type) {
      case 'message': return 'Mesaj';
      case 'announcement': return 'Duyuru';
      case 'points': return 'Puantaj';
      default: return 'Bildirim';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 text-yellow-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 bg-gradient-to-b from-gray-900 to-black border-yellow-600 border-2">
        <div className="p-4 border-b border-yellow-600">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
              <Bell className="w-5 h-5" /> Bildirimler
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h3>
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="ghost" size="sm" className="text-yellow-400 hover:bg-yellow-400 hover:text-black text-xs h-7">
                  <CheckCheck className="w-3.5 h-3.5 mr-1" /> Tümünü Okundu
                </Button>
              )}
              <Button onClick={deleteAllNotifications} variant="ghost" size="sm" className="text-red-400 hover:bg-red-400 hover:text-white text-xs h-7">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Tümünü Sil
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-yellow-600">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Henüz bildirim yok</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      !notification.is_read
                        ? 'bg-yellow-900 border-yellow-600 text-yellow-100'
                        : 'bg-gray-800 border-gray-700 text-yellow-400'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="font-semibold text-sm">{notification.title}</div>
                            <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-400">
                              {getNotificationTypeText(notification.type)}
                            </Badge>
                          </div>
                          <p className="text-sm opacity-90 line-clamp-2">{notification.content}</p>
                          <div className="text-xs opacity-75 mt-1">
                            {new Date(notification.created_date).toLocaleDateString('tr-TR')}{' '}
                            {new Date(notification.created_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!notification.is_read && <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />}
                        <Button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-red-400 hover:bg-red-400 hover:text-white flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="border-yellow-600" />
        <div className="p-3 text-center text-xs text-yellow-600">
          Toplam {notifications.length} bildirim • {unreadCount} okunmamış
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
