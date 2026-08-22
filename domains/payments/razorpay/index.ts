// packages/payment/razorpay/index.ts
// Lightweight Razorpay REST Client (Orders & Refunds)
// Ponytail: Uses native fetch() instead of legacy Razorpay SDK dependencies

export interface CreateOrderRequest {
  amountPaise: number;
  currency?: string; // default "INR"
  receipt: string;   // e.g. "booking_id_12345"
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;        // e.g. "order_EKwxwAgItmmXdp"
  entity: "order";
  amount: number;    // paise
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  created_at: number;
}

export interface CreateRefundRequest {
  paymentId: string;
  amountPaise?: number; // if omitted, full refund
  notes?: Record<string, string>;
  idempotencyKey?: string; // Ponytail: Prevent double-refunds at gateway level
}

export interface RazorpayRefundResponse {
  id: string;
  entity: "refund";
  amount: number;
  currency: string;
  payment_id: string;
  status: "pending" | "processed" | "failed";
  created_at: number;
}

export class RazorpayClient {
  private keyId: string;
  private keySecret: string;
  private baseUrl = "https://api.razorpay.com/v1";

  constructor(options?: { keyId?: string; keySecret?: string }) {
    this.keyId = options?.keyId || process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = options?.keySecret || process.env.RAZORPAY_KEY_SECRET || "";
  }

  private getAuthHeader(): string {
    const credentials = `${this.keyId}:${this.keySecret}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  /**
   * Create a new Razorpay Order for checkout
   */
  public async createOrder(req: CreateOrderRequest): Promise<RazorpayOrderResponse> {
    if (process.env.MOCK_RAZORPAY === 'true' || !this.keyId) {
      const mockOrderId = `order_mock_${crypto.randomUUID().substring(0, 10)}`;
      console.log(`[MOCK RAZORPAY] Created mock order ${mockOrderId} for receipt ${req.receipt}`);
      return {
        id: mockOrderId,
        entity: "order",
        amount: req.amountPaise,
        amount_paid: 0,
        amount_due: req.amountPaise,
        currency: req.currency || "INR",
        receipt: req.receipt,
        status: "created",
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    const res = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: req.amountPaise,
        currency: req.currency || "INR",
        receipt: req.receipt,
        notes: req.notes || {},
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Razorpay createOrder failed (${res.status}): ${errText}`);
    }

    return (await res.json()) as RazorpayOrderResponse;
  }

  /**
   * Fetch an order by ID
   */
  public async getOrder(orderId: string): Promise<RazorpayOrderResponse> {
    if (process.env.MOCK_RAZORPAY === 'true' || !this.keyId) {
      return {
        id: orderId,
        entity: "order",
        amount: 100000,
        amount_paid: 100000,
        amount_due: 0,
        currency: "INR",
        receipt: "mock_receipt",
        status: "paid",
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    const res = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: this.getAuthHeader(),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Razorpay getOrder failed (${res.status}): ${errText}`);
    }

    return (await res.json()) as RazorpayOrderResponse;
  }

  /**
   * Create a refund for a captured payment
   */
  public async createRefund(req: CreateRefundRequest): Promise<RazorpayRefundResponse> {
    // Ponytail: Mock for stress testing without hitting real Razorpay servers
    if (process.env.MOCK_RAZORPAY === 'true') {
      console.log(`[MOCK RAZORPAY] Refunded ${req.amountPaise || 'FULL'} paise for payment ${req.paymentId}`);
      return {
        id: `rfnd_mock_${Date.now()}`,
        entity: "refund",
        amount: req.amountPaise || 1000,
        currency: "INR",
        payment_id: req.paymentId,
        status: "processed",
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
      "Content-Type": "application/json",
    };

    if (req.idempotencyKey) {
      // Razorpay supports idempotency using X-Request-ID header
      headers['X-Request-ID'] = req.idempotencyKey;
    }

    const res = await fetch(`${this.baseUrl}/payments/${req.paymentId}/refund`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...(req.amountPaise ? { amount: req.amountPaise } : {}),
        notes: req.notes || {},
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Razorpay createRefund failed (${res.status}): ${errText}`);
    }

    return (await res.json()) as RazorpayRefundResponse;
  }
}

export const razorpayClient = new RazorpayClient();
