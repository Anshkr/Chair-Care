import { apiRequest, ApiResponse } from './apiClient';

export interface PaymentConfig {
  keyId: string;
  isTestMode: boolean;
  hasRealCredentials: boolean;
  currency: string;
  businessName: string;
  description: string;
  themeColor: string;
}

export interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  amountInRupees: number;
  currency: string;
  receipt: string;
  keyId: string;
  isTestMode: boolean;
  isSimulator: boolean;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  serviceDetails: {
    requestId: string;
    trackingCode: string;
    chairModel: string;
    issueDescription?: string;
    address: string;
  };
}

export interface VerifyPaymentPayload {
  requestId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  payment_method?: string;
}

export interface VerifyPaymentResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  trackingCode: string;
  warrantyExpiresAt: string;
  receiptId: string;
}

export interface PaymentReceipt {
  payment_id: string;
  amount: string | number;
  currency: string;
  payment_status: string;
  provider: string;
  transaction_id: string;
  paid_at: string;
  request_id: string;
  tracking_code: string;
  chair_model: string;
  issue_description: string;
  address: string;
  warranty_valid_until: string;
  payment_method: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  technician_name?: string;
}

export const paymentApi = {
  /**
   * Get Razorpay Gateway credentials and active test/live mode status
   */
  async getConfig(): Promise<ApiResponse<PaymentConfig>> {
    return apiRequest<PaymentConfig>('/payments/config');
  },

  /**
   * Create an order on the backend with Razorpay
   */
  async createOrder(
    requestId: string,
    amount?: number
  ): Promise<ApiResponse<PaymentOrderResponse>> {
    return apiRequest<PaymentOrderResponse>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ requestId, amount }),
    });
  },

  /**
   * Verify Razorpay cryptographic signature and settle the request in the database
   */
  async verifyPayment(
    payload: VerifyPaymentPayload
  ): Promise<ApiResponse<VerifyPaymentResponse>> {
    return apiRequest<VerifyPaymentResponse>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get verified payment receipt and warranty certificate
   */
  async getReceipt(requestId: string): Promise<ApiResponse<PaymentReceipt>> {
    return apiRequest<PaymentReceipt>(`/payments/receipt/${requestId}`);
  },
};
