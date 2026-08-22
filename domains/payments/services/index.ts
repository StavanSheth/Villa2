// domains/payments/services/index.ts
// Payments Domain Service
// Coordinates order creation, signature verification, and financial breakdown for booking checkout

import { razorpayClient, RazorpayOrderResponse } from "../razorpay/index";
import { calculateBookingPrice, toPaise, fromPaise, PricingInput, PricingBreakdown } from "../calculations/index";
import { verifyPaymentSignature, verifyWebhookSignature } from "../webhooks/index";

export interface CheckoutOrderRequest {
  bookingId: string;
  pricingInput: PricingInput;
}

export interface CheckoutOrderResponse {
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  pricing: PricingBreakdown;
}

export class PaymentsService {
  /**
   * Calculates pricing and creates a Razorpay order for checkout
   */
  public static async initiateCheckout(req: CheckoutOrderRequest): Promise<CheckoutOrderResponse> {
    const pricing = calculateBookingPrice(req.pricingInput);
    const amountPaise = toPaise(pricing.totalAmount);

    const order = await razorpayClient.createOrder({
      amountPaise,
      currency: "INR",
      receipt: `booking_${req.bookingId}`,
      notes: {
        bookingId: req.bookingId,
      },
    });

    return {
      razorpayOrderId: order.id,
      amountPaise,
      currency: order.currency,
      pricing,
    };
  }

  /**
   * Verify checkout completion signature
   */
  public static verifyCheckoutSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    return verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
    });
  }

  /**
   * Verify Razorpay Webhook signature
   */
  public static verifyWebhook(rawBody: string, signature: string): boolean {
    return verifyWebhookSignature(rawBody, signature);
  }

  /**
   * Refund a payment
   */
  public static async issueRefund(paymentId: string, amountInr?: number) {
    const amountPaise = amountInr ? toPaise(amountInr) : undefined;
    return razorpayClient.createRefund({
      paymentId,
      amountPaise,
    });
  }
}

export type { PricingBreakdown, RazorpayOrderResponse };
