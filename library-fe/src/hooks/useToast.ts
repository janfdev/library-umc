import { useState, useRef } from 'react';
import type { NotificationType } from '@/components/ui/toast';

export interface ToastItem {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
  showIcon: boolean;
  duration?: number;
}

export function useToast() {
  const [notifications, setNotifications] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const addToast = (
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = nextIdRef.current++;
    const newToast: ToastItem = {
      id,
      type,
      title,
      message,
      showIcon: true,
      duration,
    };

    setNotifications((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: number) => {
    setNotifications((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (title: string, message?: string, duration = 3000) =>
    addToast('success', title, message, duration);

  const error = (title: string, message?: string, duration = 5000) =>
    addToast('error', title, message, duration);

  const warning = (title: string, message?: string, duration = 4000) =>
    addToast('warning', title, message, duration);

  const info = (title: string, message?: string, duration = 4000) =>
    addToast('info', title, message, duration);

  const loading = (title: string, message?: string) =>
    addToast('loading', title, message, undefined);

  return {
    notifications,
    success,
    error,
    warning,
    info,
    loading,
    removeToast,
  };
}
