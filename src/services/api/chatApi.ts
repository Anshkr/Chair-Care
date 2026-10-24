import { apiRequest, ApiResponse } from './apiClient';
import { adminSyncEmitter } from '../adminSync';

export interface ChatMessageItem {
  id: string;
  requestId: string;
  senderId: string;
  senderRole: 'customer' | 'technician' | 'admin';
  senderName: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
}

export interface SupportMessageItem {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'admin' | 'customer' | 'technician' | 'system';
  senderName: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
}

export const chatApi = {
  getMessages: async (requestId: string): Promise<ApiResponse<ChatMessageItem[]>> => {
    const cleanId = (requestId || '').trim().replace(/^#/, '');
    return apiRequest<ChatMessageItem[]>(`/chat/${cleanId}`);
  },

  sendMessage: async (
    requestId: string,
    message: string,
    senderRole: 'customer' | 'technician',
    imageUrl?: string
  ): Promise<ApiResponse<ChatMessageItem>> => {
    const cleanId = (requestId || '').trim().replace(/^#/, '');
    const res = await apiRequest<ChatMessageItem>(`/chat/${cleanId}`, {
      method: 'POST',
      body: JSON.stringify({ message, senderRole, imageUrl }),
    });
    if (res.success) {
      adminSyncEmitter.notifySync();
    }
    return res;
  },

  getSupportMessages: async (ticketId: string): Promise<ApiResponse<SupportMessageItem[]>> => {
    const cleanId = (ticketId || '').trim();
    return apiRequest<SupportMessageItem[]>(`/support/${cleanId}/messages`);
  },

  sendSupportMessage: async (
    ticketId: string,
    message: string,
    imageUrl?: string
  ): Promise<ApiResponse<SupportMessageItem>> => {
    const cleanId = (ticketId || '').trim();
    const res = await apiRequest<SupportMessageItem>(`/support/${cleanId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, imageUrl }),
    });
    if (res.success) {
      adminSyncEmitter.notifySync();
    }
    return res;
  },
};
