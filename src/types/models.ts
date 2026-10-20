export type UserRole = 'customer' | 'technician' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  defaultAddress?: string;
}

export interface ChairServiceItem {
  id: string;
  code: string;
  title: string;
  description: string;
  estimatedPrice: number;
  durationMinutes: number;
  badge?: string;
  imageUrl?: string;
}

export interface BookingDraft {
  id?: string;
  trackingCode?: string;
  serviceId?: string;
  serviceCode?: string;
  serviceTitle?: string;
  chairType?: string;
  symptoms?: string[];
  problemDescription?: string;
  photoUris?: string[];
  serviceAddress?: string;
  unitOrFloor?: string;
  visitDate?: string;
  timeSlot?: string;
  estimatedTotal?: number;
}

export interface ServiceRequest {
  id: string;
  trackingCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  technicianId?: string;
  technicianName?: string;
  technicianRating?: number;
  technicianEtaMinutes?: number;
  chairModel: string;
  issueDescription: string;
  status: 'draft' | 'finding_technician' | 'assigned' | 'in_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  address: string;
  timeSlot: string;
  totalAmount: number;
  isPaid: boolean;
  warrantyValidUntil?: string;
}

export interface TechnicianRecord {
  id: string;
  name: string;
  rating: number;
  completedJobsCount: number;
  phone: string;
  isOnline: boolean;
  currentZone: string;
  vehicle: string;
  todayEarnings: number;
  activeRequestId?: string;
}
