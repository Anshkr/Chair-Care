import { apiRequest, ApiResponse } from './apiClient';
import { adminSyncEmitter } from '../adminSync';

export const technicianApi = {
  getJobs: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/technician/jobs');
  },

  getJobDetails: async (jobId: string): Promise<ApiResponse<any>> => {
    const cleanId = (jobId || '').trim().replace(/^#/, '');
    return apiRequest<any>(`/technician/jobs/${cleanId}`);
  },

  updateAvailability: async (isOnline: boolean, currentZone?: string): Promise<ApiResponse<any>> => {
    const res = await apiRequest('/technician/availability', {
      method: 'POST',
      body: JSON.stringify({ isOnline, currentZone }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  acceptJob: async (jobId: string): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/technician/jobs/${jobId}/accept`, {
      method: 'POST',
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  updateJobStatus: async (
    jobId: string,
    status: string,
    notes?: string,
    securityPin?: string
  ): Promise<ApiResponse<any>> => {
    const res = await apiRequest(`/technician/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes, securityPin }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  updateLiveLocation: async (
    jobId: string,
    latitude: number,
    longitude: number,
    etaMinutes?: number
  ): Promise<ApiResponse<any>> => {
    const cleanId = (jobId || '').trim().replace(/^#/, '');
    const res = await apiRequest(`/technician/jobs/${cleanId}/location`, {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, etaMinutes }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  uploadJobPhoto: async (
    jobId: string,
    photo: {
      id?: string;
      uri: string;
      tag?: string;
      notes?: string;
      timestamp?: string;
    }
  ): Promise<ApiResponse<any>> => {
    const cleanId = (jobId || '').trim().replace(/^#/, '');
    const res = await apiRequest(`/technician/jobs/${cleanId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ photo }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  updateJobPhotoLogs: async (
    jobId: string,
    photoLogs: any[]
  ): Promise<ApiResponse<any>> => {
    const cleanId = (jobId || '').trim().replace(/^#/, '');
    const res = await apiRequest(`/technician/jobs/${cleanId}/photos`, {
      method: 'PUT',
      body: JSON.stringify({ photoLogs }),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },

  getEarnings: async (): Promise<ApiResponse<any>> => {
    return apiRequest('/technician/earnings');
  },

  getJobHistory: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/technician/history');
  },

  getReviews: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<any[]>('/technician/reviews');
  },

  getProfile: async (): Promise<ApiResponse<any>> => {
    return apiRequest('/technician/profile');
  },

  updateProfile: async (payload: {
    name?: string;
    currentZone?: string;
    vehicleInfo?: string;
    specializations?: string[];
    experienceYears?: number;
    avatarUrl?: string;
    idProofType?: string;
    idProofNumber?: string;
    idProofDocumentUrl?: string;
  }): Promise<ApiResponse<any>> => {
    const res = await apiRequest('/technician/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res.success) adminSyncEmitter.notifySync();
    return res;
  },
};

