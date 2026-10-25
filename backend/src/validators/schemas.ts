import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Full name is required'),
  phone: z.string().optional().default(''),
  role: z.enum(['customer', 'technician']).default('customer'),
  defaultAddress: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  idProofDocumentUrl: z.string().optional(),
  addressProofDocumentUrl: z.string().optional(),
  ageProofDocumentUrl: z.string().optional(),
  experienceYears: z.union([z.number(), z.string()]).optional(),
  specializations: z.union([z.array(z.string()), z.string()]).optional(),
  currentZone: z.string().optional(),
  vehicleInfo: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createRequestSchema = z.object({
  serviceId: z.string().uuid().optional(),
  serviceCode: z.string().optional(),
  chairModel: z.string().min(2, 'Chair brand and model is required'),
  issueDescription: z.string().min(5, 'Please provide details about the issue'),
  address: z.string().min(5, 'Full service address is required'),
  unitFloor: z.string().optional(),
  timeSlot: z.string().min(1, 'Preferred time slot is required'),
  visitDate: z.string().min(1, 'Visit date is required'),
  totalAmount: z.number().nonnegative().optional().default(0),
  paymentMethod: z.string().optional().default('card'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum([
    'finding_technician',
    'assigned',
    'in_route',
    'arrived',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  notes: z.string().optional(),
  securityPin: z.string().optional(),
});

export const updateAvailabilitySchema = z.object({
  isOnline: z.boolean(),
  currentZone: z.string().optional(),
});

export const updateTechnicianLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  etaMinutes: z.number().int().min(0).max(300).optional(),
});

export const createReviewSchema = z.object({
  requestId: z.string().min(1, 'Valid request ID or tracking code is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5 stars'),
  comment: z.string().optional(),
});

export const raiseDisputeSchema = z.object({
  requestId: z.string().min(1).optional(),
  reason: z.string().min(5, 'Please provide details about the issue (at least 5 characters)'),
  subject: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('high'),
});

export const adminAssignTechSchema = z.object({
  technicianId: z.string().uuid('Valid technician UUID is required'),
});

export const adminVerifyTechSchema = z.object({
  verificationStatus: z.enum(['verified', 'rejected', 'suspended', 'pending', 'reupload_requested']),
  suspendedReason: z.string().optional(),
  rejectionReason: z.string().optional(),
  reuploadNotes: z.string().optional(),
});

export const createSupportTicketSchema = z.object({
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  requestId: z.string().uuid().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});
