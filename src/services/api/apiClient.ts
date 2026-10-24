// Centralized API Client for ChairCare Frontend
// Automatically resolves backend host and port across Web, Emulators, and Mobile LAN

import { Platform } from 'react-native';

const getDefaultApiBaseUrl = (): string => {
  // 1. Explicit environment variable configured by developer/deployment
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Default to permanent Render Cloud API
  return 'https://chair-care.onrender.com/api/v1';
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
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
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
  status?: number;
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

/**
 * Strips out any technical server, database, network, and HTTP codes/jargon.
 * Only surfaces clean, user-actionable messages (e.g. invalid fields, file uploads, invalid credentials).
 */
export function sanitizeUserErrorMessage(rawError: any, statusCode?: number): string {
  if (statusCode && statusCode >= 500) {
    return 'Something went wrong while processing your request. Please try again.';
  }

  if (statusCode === 401) {
    return 'Invalid credentials or session expired. Please log in again.';
  }

  if (statusCode === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (statusCode === 404) {
    return 'The requested record could not be found.';
  }

  let str = '';
  if (typeof rawError === 'string') {
    str = rawError;
  } else if (rawError && typeof rawError.message === 'string') {
    str = rawError.message;
  } else if (rawError && typeof rawError.error === 'string') {
    str = rawError.error;
  }

  str = str.trim();
  if (!str) {
    return 'Please check your information and try again.';
  }

  const lower = str.toLowerCase();

  // Detect technical, database, internal, or connection jargon
  const isTechnical =
    /\b(status \d+|request failed with status|\b[45]\d\d\b|sql|syntax|postgres|pg_|relation|column|parameter|deduced|foreign key|constraint|duplicate key|typeerror|referenceerror|rangeerror|syntaxerror|evalerror|database|server error|backend|internal error|unhandled|uncaught|abort|econnrefused|enotfound|enoent|network request failed|failed to fetch|socket|cors|json parse|jwt|token expired|bearer|malformed|null value|object object|\[object|spawn adb)\b/i.test(
      lower
    ) ||
    lower.includes('at async') ||
    lower.includes('at function') ||
    lower.includes('failed with status');

  if (isTechnical) {
    if (statusCode === 400) {
      return 'Please verify that all fields and documents are valid and try again.';
    }
    return 'Unable to complete this action right now. Please try again.';
  }

  return str;
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
    const timeoutMs = (options as any)?.timeout || 30000; // 30s timeout for cloud resilience
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
      if (response.status === 401) {
        setApiAuthToken(null);
      }
      return {
        success: false,
        status: response.status,
        error: sanitizeUserErrorMessage(data?.error || data?.message, response.status),
      };
    }

    return {
      ...(data as ApiResponse<T>),
      status: response.status,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'The request took too long. Please check your connection and try again.',
      };
    }
    return {
      success: false,
      error: 'Unable to connect. Please check your internet connection and try again.',
    };
  }
}
