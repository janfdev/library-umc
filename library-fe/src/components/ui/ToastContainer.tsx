// src/components/ui/ToastContainer.tsx
// Dirender SEKALI di main.tsx — di dalam <ToastProvider>
import { AnimatePresence } from 'framer-motion';
import Notification from './toast';
import { useToast } from '@/context/ToastContext';

export default function ToastContainer() {
  const { notifications, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-9999 flex flex-col gap-2 w-80 pointer-events-none"
      aria-live="polite"
      aria-label="Notifikasi sistem"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Notification
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
