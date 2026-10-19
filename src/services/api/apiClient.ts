// Centralized API Client for ChairCare Frontend
// Automatically resolves backend host and port across Web, Emulators, and Mobile LAN

import { Platform } from 'react-native';

const getDefaultApiBaseUrl = (): string => {
  // 1. Explicit environment variable configured by developer/deployment
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. On Web browser: dynamically adapt to the same hostname serving the frontend
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    return `http://${host}:5000/api/v1`;
  }

  // 3. Android or Mobile physical device default (HTTPS Cloudflare Tunnel)
  if (Platform.OS === 'android') {
    return 'https://citation-powerpoint-widespread-holes.trycloudflare.com/api/v1';
  }

  // 4. Default development fallback
  return 'https://citation-powerpoint-widespread-holes.trycloudflare.com/api/v1';
};

const getInitialToken = (): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem('chaircare_auth_token');
    } catch {
      return null;
    }
  }
  return null;
};

const getSavedApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem('chaircare_api_url');
      if (saved && saved.trim()) return saved.trim();
    } catch {
      // ignore
    }
  }
  return getDefaultApiBaseUrl();
};

let currentApiBaseUrl: string = getSavedApiBaseUrl();
let authToken: string | null = getInitialToken();

export const setApiBaseUrl = (url: string) => {
  currentApiBaseUrl = url.trim();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('chaircare_api_url', url.trim());
    } catch {
      // ignore
    }
  }
};

export const getApiBaseUrl = (): string => {
  return currentApiBaseUrl;
};

export const setApiAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (token) {
        window.localStorage.setItem('chaircare_auth_token', token);
      } else {
        window.localStorage.removeItem('chaircare_auth_token');
      }
    } catch {
      // Ignore storage errors
    }
  }
};

export const getApiAuthToken = (): string | null => {
  return authToken;
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = currentApiBaseUrl;
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data: any = null;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `Request failed with status ${response.status}`,
      };
    }

    return data as ApiResponse<T>;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'API request timed out. Please check your backend connection.',
      };
    }
    return {
      success: false,
      error: `Could not connect to ChairCare backend API at ${baseUrl}. Please ensure backend is running. (${err.message || 'Connection Refused'})`,
    };
  }
}
