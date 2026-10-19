import { apiRequest, ApiResponse } from './apiClient';
import { adminSyncEmitter } from '../adminSync';

export interface ChatMessageItem {
  id: string;
  requestId: string;
  senderId: string;
  senderRole: 'customer' | 'technician';
  senderName: string;
  message: string;
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
    senderRole: 'customer' | 'technician'
  ): Promise<ApiResponse<ChatMessageItem>> => {
    const cleanId = (requestId || '').trim().replace(/^#/, '');
    const res = await apiRequest<ChatMessageItem>(`/chat/${cleanId}`, {
      method: 'POST',
      body: JSON.stringify({ message, senderRole }),
    });
    if (res.success) {
      adminSyncEmitter.notifySync();
    }
    return res;
  },
};
