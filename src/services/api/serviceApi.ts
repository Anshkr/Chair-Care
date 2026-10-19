import { apiRequest, ApiResponse } from './apiClient';

export interface ServiceItem {
  id: string;
  code: string;
  title: string;
  description: string;
  estimatedPrice: number;
  durationMinutes: number;
  badge?: string;
  imageUrl?: string;
}

export const serviceApi = {
  getAll: async (): Promise<ApiResponse<ServiceItem[]>> => {
    return apiRequest<ServiceItem[]>('/services');
  },

  getById: async (idOrCode: string): Promise<ApiResponse<ServiceItem>> => {
    return apiRequest<ServiceItem>(`/services/${idOrCode}`);
  },
};
