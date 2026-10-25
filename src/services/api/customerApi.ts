import { apiRequest, ApiResponse } from './apiClient';
import { adminSyncEmitter } from '../adminSync';

export interface CreateBookingPayload {
  serviceId?: string;
  serviceCode?: string;
  chairModel: string;
  issueDescription: string;
  address: string;
  unitFloor?: string;
  timeSlot: string;
  visitDate: string;
  totalAmount?: number;
  paymentMethod?: string;
  latitude?: number;
  longitude?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export const customerApi = {
  createBooking: async (payload: CreateBookingPayload): Promise<ApiResponse<any>> => {
    const res = await apiRequest('/customer/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  getMyRequests: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/customer/requests');
  },

  getRequestDetails: async (idOrTrackingCode: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/customer/requests/${idOrTrackingCode}`);
  },

  getRequestById: async (idOrTrackingCode: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/customer/requests/${idOrTrackingCode}`);
  },

  cancelRequest: async (id: string, reason?: string): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/customer/requests/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  submitReview: async (payload: {
    requestId: string;
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<any>> => {
    const res = await apiRequest('/customer/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  raiseDispute: async (payload: {
    requestId: string;
    reason: string;
    subject?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/customer/requests/${payload.requestId}/dispute`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },
};
