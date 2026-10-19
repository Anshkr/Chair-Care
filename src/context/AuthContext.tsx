import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types/models';
import { authApi, technicianApi } from '../services/api';
import { adminSyncEmitter } from '../services/adminSync';

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role?: UserRole;
  defaultAddress?: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

interface AuthContextType {
  role: UserRole; // Current active UI portal
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  isCustomerAuthorized: boolean;
  isTechnicianAuthorized: boolean;
  isAdminAuthorized: boolean;
  currentUser: UserProfile | null;
  pendingReturnRoute: string | null;
  setPendingReturnRoute: (route: string | null) => void;
  login: (emailOrPhone: string, password?: string, targetRole?: UserRole) => Promise<AuthActionResult>;
  register: (payload: RegisterPayload) => Promise<AuthActionResult>;
  updateUserProfile: (data: {
    name?: string;
    defaultAddress?: string;
    avatarUrl?: string;
  }) => Promise<AuthActionResult>;
  updateTechnicianProfile: (data: {
    name?: string;
    currentZone?: string;
    vehicleInfo?: string;
    specializations?: string[];
    experienceYears?: number;
    avatarUrl?: string;
  }) => Promise<AuthActionResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingReturnRoute, setPendingReturnRoute] = useState<string | null>(null);

  // Server-verified authorization checks
  const isCustomerAuthorized = isAuthenticated && currentUser?.role === 'customer';
  const isTechnicianAuthorized = isAuthenticated && currentUser?.role === 'technician';
  const isAdminAuthorized = isAuthenticated && currentUser?.role === 'admin';

  // Restore authenticated session on mount if token is valid
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const res = await authApi.getMe();
        if (isMounted && res.success && res.data?.user) {
          const user: UserProfile = {
            id: res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email,
            phone: res.data.user.phone,
            role: res.data.user.role,
            avatarUrl: res.data.user.avatarUrl || (res.data.user as any).avatar_url,
            defaultAddress:
              res.data.profile?.default_address ||
              res.data.profile?.defaultAddress ||
              (res.data.user as any).defaultAddress ||
              (res.data.user as any).address,
          };
          setCurrentUser(user);
          setRole(user.role);
          setIsAuthenticated(true);
        }
      } catch {
        // Session not present or expired
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    emailOrPhone: string,
    password?: string,
    targetRole?: UserRole
  ): Promise<AuthActionResult> => {
    const input = emailOrPhone.trim().toLowerCase();

    if (!input) {
      return { success: false, error: 'Email or phone number is required.' };
    }

    try {
      const res = await authApi.login(input, password || '');
      if (res.success && res.data) {
        const loggedUser: UserProfile = {
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone,
          role: res.data.user.role,
          avatarUrl: res.data.user.avatarUrl || (res.data.user as any).avatar_url,
          defaultAddress:
            res.data.profile?.default_address ||
            res.data.profile?.defaultAddress ||
            (res.data.user as any).defaultAddress ||
            (res.data.user as any).address,
        };

        // If a specific role is requested (e.g. admin logging in to admin portal), verify role match
        if (targetRole && loggedUser.role !== targetRole) {
          return {
            success: false,
            error: `Access denied. Your account does not have '${targetRole}' permissions.`,
          };
        }

        setCurrentUser(loggedUser);
        setRole(loggedUser.role);
        setIsAuthenticated(true);
        return { success: true, user: loggedUser };
      } else {
        return {
          success: false,
          error: res.error || 'Invalid credentials. Please verify and try again.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unable to connect to authentication service.',
      };
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthActionResult> => {
    try {
      const regRole: UserRole = payload.role === 'technician' ? 'technician' : 'customer';
      const res = await authApi.register({
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        password: payload.password || '',
        role: regRole,
      });

      if (res.success && res.data) {
        const newUser: UserProfile = {
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone,
          role: regRole,
          avatarUrl: res.data.user.avatarUrl || (res.data.user as any).avatar_url,
          defaultAddress: payload.defaultAddress || (res.data.user as any).defaultAddress,
        };
        setCurrentUser(newUser);
        setRole(regRole);
        setIsAuthenticated(true);
        return { success: true, user: newUser };
      } else {
        return {
          success: false,
          error: res.error || 'Failed to create account. Please try again.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'An unexpected error occurred during registration.',
      };
    }
  };

  const updateUserProfile = async (data: {
    name?: string;
    defaultAddress?: string;
    avatarUrl?: string;
  }): Promise<AuthActionResult> => {
    try {
      const res = await authApi.updateProfile(data);
      if (res.success && res.data?.user) {
        const rawAvatar =
          res.data.user.avatarUrl !== undefined
            ? res.data.user.avatarUrl
            : (res.data.user as any).avatar_url !== undefined
            ? (res.data.user as any).avatar_url
            : data.avatarUrl;

        const normalizedAvatar =
          rawAvatar && rawAvatar !== '__REMOVE__' && rawAvatar !== ''
            ? rawAvatar
            : undefined;

        const updated: UserProfile = {
          id: res.data.user.id,
          name: res.data.user.name || data.name || currentUser?.name || '',
          email: res.data.user.email || currentUser?.email || '',
          phone: res.data.user.phone || currentUser?.phone || '',
          role: res.data.user.role || currentUser?.role || 'customer',
          avatarUrl: normalizedAvatar !== undefined ? normalizedAvatar : currentUser?.avatarUrl,
          defaultAddress:
            res.data.profile?.default_address !== undefined
              ? res.data.profile?.default_address
              : data.defaultAddress !== undefined
              ? data.defaultAddress
              : currentUser?.defaultAddress,
        };
        setCurrentUser({ ...updated });
        adminSyncEmitter.notifySync();
        return { success: true, user: updated };
      }
      return { success: false, error: res.error || 'Failed to update profile.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating profile.' };
    }
  };

  const updateTechnicianProfile = async (data: {
    name?: string;
    currentZone?: string;
    vehicleInfo?: string;
    specializations?: string[];
    experienceYears?: number;
    avatarUrl?: string;
  }): Promise<AuthActionResult> => {
    try {
      const res = await technicianApi.updateProfile(data);
      if (res.success && res.data) {
        const rawAvatar =
          res.data.avatarUrl !== undefined
            ? res.data.avatarUrl
            : (res.data as any).avatar_url !== undefined
            ? (res.data as any).avatar_url
            : data.avatarUrl;
        const normalizedAvatar =
          rawAvatar === '__REMOVE__' || !rawAvatar ? undefined : rawAvatar;

        const updated: UserProfile = {
          id: res.data.id || currentUser?.id || '',
          name: res.data.name || currentUser?.name || '',
          email: res.data.email || currentUser?.email || '',
          phone: res.data.phone || currentUser?.phone || '',
          role: 'technician',
          avatarUrl: normalizedAvatar,
        };
        setCurrentUser({ ...updated });
        adminSyncEmitter.notifySync();
        return { success: true, user: updated };
      }
      return { success: false, error: res.error || 'Failed to update technician profile.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating technician profile.' };
    }
  };

  const logout = () => {
    authApi.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPendingReturnRoute(null);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        isAuthenticated,
        isCustomerAuthorized,
        isTechnicianAuthorized,
        isAdminAuthorized,
        currentUser,
        pendingReturnRoute,
        setPendingReturnRoute,
        login,
        register,
        updateUserProfile,
        updateTechnicianProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
