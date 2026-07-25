import { useEffect, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';

export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket() || connectSocket();
    const listener = (data: T) => handlerRef.current(data);
    socket.on(event, listener as (...args: unknown[]) => void);

    return () => {
      socket.off(event, listener as (...args: unknown[]) => void);
    };
  }, [event, isAuthenticated]);
}

export function useSocket(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token]);
}
