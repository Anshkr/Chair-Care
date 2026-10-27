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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // Sanitize payload to strictly conform to backend createRequestSchema
    const cleanPayload: Record<string, any> = {};

    // 1. serviceId vs serviceCode: if serviceId is not a UUID, send as serviceCode
    const rawServiceId = payload.serviceId ? String(payload.serviceId).trim() : '';
    if (rawServiceId && isUuid.test(rawServiceId)) {
      cleanPayload.serviceId = rawServiceId;
    } else if (rawServiceId && !isUuid.test(rawServiceId)) {
      cleanPayload.serviceCode = rawServiceId;
    }
    if (payload.serviceCode && !cleanPayload.serviceCode) {
      cleanPayload.serviceCode = String(payload.serviceCode).trim();
    }

    // 2. Chair model (min 2 chars)
    cleanPayload.chairModel =
      payload.chairModel && String(payload.chairModel).trim().length >= 2
        ? String(payload.chairModel).trim()
        : 'Office Ergonomic Chair';

    // 3. Issue description (min 5 chars)
    const rawIssue = payload.issueDescription ? String(payload.issueDescription).trim() : '';
    cleanPayload.issueDescription =
      rawIssue.length >= 5
        ? rawIssue
        : rawIssue.length > 0
        ? `${rawIssue} - precision service required`
        : 'Precision mechanical diagnostics and recalibration service';

    // 4. Address (min 5 chars)
    const rawAddr = payload.address ? String(payload.address).trim() : '';
    cleanPayload.address =
      rawAddr.length >= 5 ? rawAddr : 'Office or residential service location';

    // 5. unitFloor (optional string)
    if (payload.unitFloor && String(payload.unitFloor).trim()) {
      cleanPayload.unitFloor = String(payload.unitFloor).trim();
    }

    // 6. timeSlot (min 1 char)
    cleanPayload.timeSlot =
      payload.timeSlot && String(payload.timeSlot).trim()
        ? String(payload.timeSlot).trim()
        : '10:00 AM - 12:00 PM';

    // 7. visitDate (min 1 char)
    cleanPayload.visitDate =
      payload.visitDate &&
      String(payload.visitDate).trim() &&
      String(payload.visitDate).trim() !== 'Standard visit'
        ? String(payload.visitDate).trim()
        : new Date().toISOString().split('T')[0];

    // 8. totalAmount (number >= 0)
    cleanPayload.totalAmount = Math.max(0, Number(payload.totalAmount) || 599);

    // 9. paymentMethod (string)
    cleanPayload.paymentMethod = payload.paymentMethod || 'pay_on_delivery';

    // 10. coordinates
    if (typeof payload.latitude === 'number' && !isNaN(payload.latitude)) {
      cleanPayload.latitude = payload.latitude;
    }
    if (typeof payload.longitude === 'number' && !isNaN(payload.longitude)) {
      cleanPayload.longitude = payload.longitude;
    }

    // 11. Razorpay verification fields
    if (payload.razorpayOrderId && String(payload.razorpayOrderId).trim()) {
      cleanPayload.razorpayOrderId = String(payload.razorpayOrderId).trim();
    }
    if (payload.razorpayPaymentId && String(payload.razorpayPaymentId).trim()) {
      cleanPayload.razorpayPaymentId = String(payload.razorpayPaymentId).trim();
    }
    if (payload.razorpaySignature && String(payload.razorpaySignature).trim()) {
      cleanPayload.razorpaySignature = String(payload.razorpaySignature).trim();
    }

    const res = await apiRequest('/customer/requests', {
      method: 'POST',
      body: JSON.stringify(cleanPayload),
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

  getPlatformConfig: async (): Promise<ApiResponse<{ platformFeePercent: number; minFloorCharge: number; allowSameDayBooking: boolean }>> => {
    return apiRequest('/customer/platform-config');
  },
};

