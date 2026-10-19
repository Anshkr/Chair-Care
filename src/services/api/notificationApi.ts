import { apiRequest, ApiResponse } from './apiClient';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async (params?: { role?: string }): Promise<ApiResponse<AppNotification[]>> => {
    const qs = params?.role ? `?role=${encodeURIComponent(params.role)}` : '';
    return apiRequest<AppNotification[]>(`/notifications${qs}`);
  },

  getUnreadCount: async (params?: { role?: string }): Promise<ApiResponse<{ count: number }>> => {
    const qs = params?.role ? `?role=${encodeURIComponent(params.role)}` : '';
    return apiRequest<{ count: number }>(`/notifications/unread-count${qs}`);
  },

  markAsRead: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
  },

  markAllAsRead: async (): Promise<ApiResponse<any>> => {
    return apiRequest('/notifications/read-all', { method: 'PUT' });
  },

  deleteNotification: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/notifications/${id}`, { method: 'DELETE' });
  },
};
