import { apiRequest, ApiResponse } from './apiClient';
import { adminSyncEmitter } from '../adminSync';

export const adminApi = {
  getDashboardMetrics: async (): Promise<ApiResponse<any>> => {
    return apiRequest('/admin/dashboard');
  },

  getAllRequests: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest(`/admin/requests${queryStr}`);
  },

  getAllTechnicians: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/admin/technicians');
  },

  getTechnicianDetails: async (technicianId: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/admin/technicians/${technicianId}`);
  },

  verifyTechnician: async (
    technicianId: string,
    verificationStatus: 'verified' | 'rejected' | 'suspended' | 'reupload_requested',
    rejectionReason?: string,
    suspendedReason?: string,
    reuploadNotes?: string
  ): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/admin/technicians/${technicianId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({
        verificationStatus,
        rejectionReason: verificationStatus === 'rejected' ? rejectionReason : undefined,
        suspendedReason: verificationStatus === 'suspended' ? (suspendedReason || rejectionReason) : undefined,
        reuploadNotes: verificationStatus === 'reupload_requested' ? (reuploadNotes || rejectionReason) : undefined,
      }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  createTechnician: async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    zone?: string;
    vehicleInfo?: string;
  }): Promise<ApiResponse<any>> => {
    const res = await apiRequest('/admin/technicians', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  assignTechnician: async (requestId: string, technicianId: string): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/admin/requests/${requestId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ technicianId }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  getPayments: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/admin/payments');
  },

  getAllCustomers: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/admin/customers');
  },

  getReviews: async (): Promise<ApiResponse<any>> => {
    return apiRequest('/admin/reviews');
  },

  moderateReview: async (
    reviewId: string,
    action: 'hide' | 'dismiss' | 'flag',
    notes?: string
  ): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/admin/reviews/${reviewId}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ action, notes }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  getAdminUsers: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/admin/admins');
  },

  createAdminUser: async (data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role?: string;
  }): Promise<ApiResponse<any>> => {
    const res = await apiRequest('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  getActivityLogs: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/admin/logs');
  },

  getSupportTickets: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/admin/support');
  },

  getSupportTicketById: async (ticketId: string): Promise<ApiResponse<any>> => {
    const cleanId = (ticketId || '').trim();
    return apiRequest<any>(`/admin/support/${cleanId}`);
  },

  openSupportChat: async (ticketId: string): Promise<ApiResponse<any>> => {
    const cleanId = (ticketId || '').trim();
    const res = await apiRequest(`/admin/support/${cleanId}/open-chat`, {
      method: 'POST',
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  assignSupportTicket: async (ticketId: string, assignee: string): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/admin/support/${ticketId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignee }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  resolveSupportTicket: async (ticketId: string, resolutionNotes?: string): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/admin/support/${ticketId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionNotes }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  getDisputes: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/admin/disputes');
  },

  processRefund: async (refundId: string): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/admin/refunds/${refundId}/process`, {
      method: 'POST',
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  getSystemStatus: async (): Promise<ApiResponse<any>> => {
    return apiRequest('/admin/system/status');
  },

  getAllServices: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/admin/services');
  },

  createService: async (data: {
    title: string;
    description?: string;
    price: number;
    durationMinutes?: number;
    badge?: string;
    code?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> => {
    const res = await apiRequest('/admin/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  updateService: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      durationMinutes?: number;
      badge?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/admin/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  deleteService: async (id: string): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/admin/services/${id}`, {
      method: 'DELETE',
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  getPlatformConfig: async (): Promise<ApiResponse<PlatformConfigData>> => {
    return apiRequest<PlatformConfigData>('/admin/platform-config');
  },

  updatePlatformConfig: async (
    data: Partial<PlatformConfigData>
  ): Promise<ApiResponse<PlatformConfigData>> => {
    const res = await apiRequest<PlatformConfigData>('/admin/platform-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },
};

export interface PlatformConfigData {
  id?: number;
  masterSwitch: boolean;
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  settlementCurrency: 'INR' | 'USD' | 'AED';
  timeZone: string;
  enableCustomerBookings: boolean;
  allowSameDayBooking: boolean;
  minDispatchNotice: number;
  advanceDays: number;
  operatingSchedule?: {
    mon_fri?: string;
    saturday?: string;
    sunday?: string;
    active_days?: string;
  };
  activeFieldRequestsCount?: number;
  updatedAt?: string;
  updatedBy?: string | null;
}



