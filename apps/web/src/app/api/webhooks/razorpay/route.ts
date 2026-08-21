// apps/web/src/app/api/webhooks/razorpay/route.ts
// POST /api/webhooks/razorpay — Razorpay Webhook Event Handler (Idempotent)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@villa-platform/database";
import { verifyWebhookSignature } from "@villa-platform/payment";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    // SECURITY: Verify webhook signature - fail closed
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ success: false, error: "Webhook secret not configured" }, { status: 500 });
      }
      console.warn("RAZORPAY_WEBHOOK_SECRET not set - skipping signature check in dev mode");
    } else if (signature) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ success: false, error: "Missing webhook signature header" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event; // e.g. "payment.captured", "order.paid", "payment.failed"
    const payload = event.payload;

    if (eventType === "payment.captured" && payload?.payment?.entity) {
      const payment = payload.payment.entity;
      const orderId = payment.order_id;

      if (orderId) {
        const transaction = await prisma.paymentTransaction.findFirst({
          where: { razorpayOrderId: orderId },
          include: { booking: true },
        });

        if (transaction && transaction.status !== "CAPTURED") {
          await prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              status: "CAPTURED",
              razorpayPaymentId: payment.id,
            },
          });

          const booking = transaction.booking;
          const newPaid = Number(booking.totalPaid) + Number(transaction.amount);
          const newStatus = newPaid >= Number(booking.currentTotal) ? "CONFIRMED" : "ADVANCE_PAID";

          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              totalPaid: newPaid,
              status: newStatus,
            },
          });
        }
      }
    } else if (eventType === "payment.failed" && payload?.payment?.entity) {
      const payment = payload.payment.entity;
      const orderId = payment.order_id;
      if (orderId) {
        const transaction = await prisma.paymentTransaction.findFirst({
          where: { razorpayOrderId: orderId },
        });
        if (transaction) {
          await prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: { status: "FAILED" },
          });
        }
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing error" }, { status: 500 });
  }
}
