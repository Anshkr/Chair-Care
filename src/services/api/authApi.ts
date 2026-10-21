import { apiRequest, setApiAuthToken, getApiAuthToken, ApiResponse } from './apiClient';
import { UserRole } from '../../types/models';

export interface AuthResponseData {
  token: string;
  user: {
    id: string;
    email: string;
    phone: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    defaultAddress?: string;
  };
  profile?: any;
}

export const authApi = {
  login: async (email: string, password?: string): Promise<ApiResponse<AuthResponseData>> => {
    const res = await apiRequest<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password || '' }),
    });

    if (res.success && res.data?.token) {
      setApiAuthToken(res.data.token);
    }
    return res;
  },

  register: async (payload: {
    email: string;
    password?: string;
    name: string;
    phone?: string;
    role?: UserRole;
    defaultAddress?: string;
    idProofType?: string;
    idProofNumber?: string;
    idProofDocumentUrl?: string;
    addressProofDocumentUrl?: string;
    ageProofDocumentUrl?: string;
    experienceYears?: number;
    specializations?: string[] | string;
    currentZone?: string;
    vehicleInfo?: string;
  }): Promise<ApiResponse<AuthResponseData>> => {
    const res = await apiRequest<AuthResponseData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        password: payload.password || '',
      }),
    });

    if (res.success && res.data?.token) {
      setApiAuthToken(res.data.token);
    }
    return res;
  },

  getMe: async (): Promise<ApiResponse<any>> => {
    const token = getApiAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'No active session token',
      };
    }
    return apiRequest('/auth/me');
  },

  updateProfile: async (payload: {
    name?: string;
    defaultAddress?: string;
    avatarUrl?: string;
  }): Promise<ApiResponse<any>> => {
    return apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  logout: () => {
    setApiAuthToken(null);
  },
};
