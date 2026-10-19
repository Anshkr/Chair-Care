import { ChairServiceItem, ServiceRequest, TechnicianRecord, UserProfile } from '../types/models';

export const MOCK_SERVICES: ChairServiceItem[] = [
  {
    id: 'svc-01',
    code: 'SVC-REF-8924',
    title: 'Office Chair Pneumatic & Tilt Overhaul',
    description: 'Class-4 gas lift replacement, multi-angle tilt mechanism re-tensioning, caster lubrication.',
    estimatedPrice: 799,
    durationMinutes: 45,
    badge: 'CALIBRATION READY',
  },
  {
    id: 'svc-02',
    code: 'SVC-REF-8925',
    title: 'Executive Mesh Re-Tensioning & Ergonomic Alignment',
    description: 'Postural lumbar calibration, mesh elasticity restoration, armrest 4D track alignment.',
    estimatedPrice: 999,
    durationMinutes: 60,
    badge: 'POPULAR',
  },
  {
    id: 'svc-03',
    code: 'SVC-REF-8926',
    title: 'Heavy Duty Caster & Wheel Base Replacement',
    description: 'Industrial nylon twin-wheel casters, reinforced aluminum base installation.',
    estimatedPrice: 649,
    durationMinutes: 30,
  }
];

export const MOCK_TECHNICIANS: TechnicianRecord[] = [
  {
    id: 'tech-01',
    name: 'Rahul Sharma',
    rating: 4.9,
    completedJobsCount: 1240,
    phone: '+91 98765 43210',
    isOnline: true,
    currentZone: 'South Delhi / Gurgaon',
    vehicle: 'Honda Activa (DL-4S-AB-1928)',
    todayEarnings: 3420,
    activeRequestId: 'CC-10483',
  },
  {
    id: 'tech-02',
    name: 'Vikram Singh',
    rating: 4.8,
    completedJobsCount: 890,
    phone: '+91 98112 34567',
    isOnline: true,
    currentZone: 'Noida / East Delhi',
    vehicle: 'TVS Jupiter (UP-16-CD-4019)',
    todayEarnings: 2150,
  }
];

export const MOCK_ACTIVE_REQUEST: ServiceRequest = {
  id: 'req-10483',
  trackingCode: 'CC-10483',
  customerId: 'cust-ansh',
  customerName: 'Ansh Kumar',
  customerPhone: '+91 99887 76655',
  technicianId: 'tech-01',
  technicianName: 'Rahul Sharma',
  technicianRating: 4.9,
  technicianEtaMinutes: 14,
  chairModel: 'Herman Miller Aeron (Size B)',
  issueDescription: 'Pneumatic cylinder sinking slowly under load, tilt limiter slipping at 110-degree lock.',
  status: 'assigned',
  createdAt: '2026-10-06 00:30',
  address: 'Block C, Cyber City, DLF Phase 2, Sector 24, Gurugram',
  timeSlot: 'Today, 02:00 PM - 03:00 PM',
  totalAmount: 1850,
  isPaid: true,
  warrantyValidUntil: '2027-01-06',
};

export const MOCK_USERS: Record<string, UserProfile> = {
  customer: {
    id: 'cust-ansh',
    name: 'Ansh Kumar',
    phone: '+91 99887 76655',
    email: 'ansh@chaircare.app',
    role: 'customer',
  },
  technician: {
    id: 'tech-01',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'rahul.tech@chaircare.app',
    role: 'technician',
  },
  admin: {
    id: 'admin-priya',
    name: 'Priya Sharma',
    phone: '+91 91234 56789',
    email: 'priya.ops@chaircare.app',
    role: 'admin',
  }
};
