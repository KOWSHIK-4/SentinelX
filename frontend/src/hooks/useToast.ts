import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}

type Listener = (toasts: Toast[]) => void;
let listeners: Listener[] = [];
let toasts: Toast[] = [];
let toastId = 0;

function notifyListeners() {
  for (const listener of listeners) {
    listener([...toasts]);
  }
}

export function toast(t: Omit<Toast, 'id'>) {
  const id = (++toastId).toString();
  toasts = [...toasts, { ...t, id }];
  notifyListeners();
  setTimeout(() => {
    toasts = toasts.filter((p) => p.id !== id);
    notifyListeners();
  }, 4000);
}

export function useToast() {
  const [state, setState] = useState<Toast[]>([]);

  useState(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  });

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((p) => p.id !== id);
    notifyListeners();
  }, []);

  return { toasts: state, toast, dismiss };
}