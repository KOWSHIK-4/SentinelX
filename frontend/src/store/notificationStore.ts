import { create } from 'zustand';
import { useSocketEvent } from '@/hooks/useSocketEvent';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  incrementUnread: () => void;
  resetUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
}));

export function useNotificationSocket(): void {
  const incrementUnread = useNotificationStore((s) => s.incrementUnread);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useSocketEvent('notification:created', () => {
    incrementUnread();
  });

  useSocketEvent('notification:allRead', () => {
    setUnreadCount(0);
  });
}
