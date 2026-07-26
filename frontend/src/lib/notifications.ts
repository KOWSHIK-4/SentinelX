import { api, clearCacheForPattern } from './client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  isRead: boolean;
  link: string | null;
  userId: string;
  createdAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
}

export interface NotificationResponse {
  success: boolean;
  data: Notification;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export const notificationApi = {
  list: () =>
    api<NotificationListResponse>('/notifications', { cacheTTL: 15000 }),

  create: (data: { title: string; message: string; type: string; severity?: string; link?: string | null }) =>
    api<NotificationResponse>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false,
    }),

  markRead: (id: string) => {
    clearCacheForPattern(/\/notifications/);
    return api<NotificationResponse>(`/notifications/${id}/read`, {
      method: 'PUT',
      useCache: false,
    });
  },

  markAllRead: () => {
    clearCacheForPattern(/\/notifications/);
    return api<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PUT',
      useCache: false,
    });
  },

  delete: (id: string) => {
    clearCacheForPattern(/\/notifications/);
    return api<DeleteResponse>(`/notifications/${id}`, {
      method: 'DELETE',
      useCache: false,
    });
  },
};
