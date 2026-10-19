import { Request } from 'express';

export type UserRole = 'customer' | 'technician' | 'admin';

export type ServiceRequestStatus =
  | 'draft'
  | 'finding_technician'
  | 'assigned'
  | 'in_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';

export interface UserEntity {
  id: string;
  email: string;
  phone: string;
  name: string;
  password_hash: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface CustomerProfileEntity {
  id: string;
  user_id: string;
  default_address?: string;
  loyalty_points: number;
  created_at: Date;
  updated_at: Date;
}

export interface TechnicianProfileEntity {
  id: string;
  user_id: string;
  rating: number;
  completed_jobs_count: number;
  is_online: boolean;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  current_zone: string;
  vehicle_info?: string;
  today_earnings: number;
  suspended_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceEntity {
  id: string;
  code: string;
  title: string;
  description: string;
  estimated_price: number;
  duration_minutes: number;
  badge?: string;
  image_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceRequestEntity {
  id: string;
  tracking_code: string;
  customer_id: string;
  technician_id?: string;
  service_id?: string;
  chair_model: string;
  issue_description: string;
  status: ServiceRequestStatus;
  address: string;
  unit_floor?: string;
  time_slot: string;
  visit_date: string;
  total_amount: number;
  is_paid: boolean;
  payment_method?: string;
  cancellation_reason?: string;
  warranty_valid_until?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

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
