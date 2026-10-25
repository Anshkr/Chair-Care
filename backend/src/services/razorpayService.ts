import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env';

/**
 * Razorpay Payment Gateway Service
 * Supports both real Razorpay credentials (Test & Live modes)
 * and seamless Developer Sandbox Simulator mode when credentials are pending.
 */
class RazorpayService {
  private razorpayInstance: Razorpay | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    const keyId = env.RAZORPAY_KEY_ID?.trim() || '';
    const keySecret = env.RAZORPAY_KEY_SECRET?.trim() || '';

    // Check if real key credentials are provided (starts with rzp_test_ or rzp_live_ and has secret)
    const isRealKey =
      (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_')) &&
      keyId !== 'rzp_test_chaircare_mock_id' &&
      keySecret.length >= 8;

    if (isRealKey) {
      try {
        this.razorpayInstance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
        this.isConfigured = true;
        console.log(`💳 [Razorpay Service]: Initialized with ${keyId.startsWith('rzp_live_') ? 'PRODUCTION' : 'TEST'} credentials (${keyId.substring(0, 12)}...)`);
      } catch (err: any) {
        console.warn('⚠️ [Razorpay Init Warning]: Failed to initialize Razorpay SDK:', err.message);
        this.isConfigured = false;
        this.razorpayInstance = null;
      }
    } else {
      this.isConfigured = false;
      this.razorpayInstance = null;
      console.log('🧪 [Razorpay Service]: Running in Razorpay Test / Simulator Mode (Sandbox active). Ready for real key entry at any time.');
    }
  }

  /**
   * Reload configuration (useful when admin updates credentials or .env is refreshed)
   */
  public reloadConfig() {
    this.init();
  }

  /**
   * Whether real Razorpay credentials are bound
   */
  public hasRealCredentials(): boolean {
    return this.isConfigured && this.razorpayInstance !== null;
  }

  /**
   * Check if running in test/sandbox mode
   */
  public isTestMode(): boolean {
    const keyId = env.RAZORPAY_KEY_ID || '';
    return !this.isConfigured || keyId.startsWith('rzp_test_') || keyId.includes('mock');
  }

  /**
   * Public Razorpay Key ID for client checkout
   */
  public getKeyId(): string {
    if (this.isConfigured && env.RAZORPAY_KEY_ID) {
      return env.RAZORPAY_KEY_ID;
    }
    return 'rzp_test_chaircare_mock_id';
  }

  /**
   * Create an Order for checkout
   * @param amountInRupees Total charge in INR (e.g. 749 or 599.50)
   * @param receipt Unique identifier (e.g. tracking code like CC-8492)
   * @param notes Additional metadata tags
   */
  public async createOrder(params: {
    amountInRupees: number;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    isSimulator: boolean;
  }> {
    const amountInSubunits = Math.round(Number(params.amountInRupees) * 100);
    const receiptCode = String(params.receipt || 'RCPT').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);

    if (this.hasRealCredentials() && this.razorpayInstance) {
      try {
        const order = await this.razorpayInstance.orders.create({
          amount: amountInSubunits,
          currency: 'INR',
          receipt: receiptCode,
          notes: params.notes || {},
        });

        return {
          id: order.id,
          amount: Number(order.amount),
          currency: order.currency || 'INR',
          receipt: order.receipt || receiptCode,
          isSimulator: false,
        };
      } catch (err: any) {
        console.error('❌ [Razorpay API orders.create Error]:', err.error || err.message);
        throw new Error(err.error?.description || err.message || 'Razorpay order creation failed');
      }
    }

    // 🧪 Simulator / Test Sandbox fallback
    const simulatedOrderId = `order_test_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
    return {
      id: simulatedOrderId,
      amount: amountInSubunits,
      currency: 'INR',
      receipt: receiptCode,
      isSimulator: true,
    };
  }

  /**
   * Verify HMAC SHA-256 signature from Razorpay Checkout callback
   */
  public verifySignature(params: {
    orderId: string;
    paymentId: string;
    signature?: string;
  }): boolean {
    const { orderId, paymentId, signature } = params;

    if (!orderId || !paymentId) {
      return false;
    }

    if (this.hasRealCredentials()) {
      const secret = env.RAZORPAY_KEY_SECRET;
      if (!secret || !signature) {
        return false;
      }

      try {
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex');

        return crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'utf-8'),
          Buffer.from(signature, 'utf-8')
        );
      } catch (err: any) {
        console.error('❌ [Razorpay Signature Verification Error]:', err.message);
        return false;
      }
    }

    // Simulator mode: accepts any valid simulated payment ID
    return Boolean(paymentId.length >= 6);
  }

  /**
   * Verify Razorpay Webhook Signature
   */
  public verifyWebhook(rawBody: string, signature: string): boolean {
    const secret = env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET;
    if (!secret || !signature) return false;

    try {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected, 'utf-8'), Buffer.from(signature, 'utf-8'));
    } catch {
      return false;
    }
  }
}

export const razorpayService = new RazorpayService();
