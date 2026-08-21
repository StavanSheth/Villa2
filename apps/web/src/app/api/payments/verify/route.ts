// apps/web/src/app/api/payments/verify/route.ts
// POST /api/payments/verify — Verify Razorpay HMAC signature & capture payment

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@villa-platform/database";
import { getAuthUser } from "@villa-platform/auth/permissions";
import { verifyPaymentSignature } from "@villa-platform/payment";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mock_verify } = body;

    if (!razorpay_order_id || (!mock_verify && (!razorpay_payment_id || !razorpay_signature))) {
      return NextResponse.json({ success: false, error: "Missing verification parameters" }, { status: 400 });
    }

    // Check HMAC-SHA256 signature unless using dev mock
    let isValid = false;
    if (mock_verify && process.env.NODE_ENV !== "production") {
      isValid = true;
    } else if (razorpay_signature && razorpay_payment_id) {
      try {
        isValid = verifyPaymentSignature({
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        });
      } catch (err) {
        console.error("Signature verification failed:", err);
        isValid = false;
      }
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
    }

    const transaction = await prisma.paymentTransaction.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
      include: { booking: true },
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Payment transaction not found" }, { status: 404 });
    }

    // Update transaction ledger
    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "CAPTURED",
        razorpayPaymentId: razorpay_payment_id || `pay_mock_${Math.random().toString(36).substring(2, 10)}`,
        razorpaySignature: razorpay_signature || "mock_sig",
      },
    });

    // Calculate new paid total
    const booking = transaction.booking;
    const newPaidAmount = Number(booking.totalPaid) + Number(transaction.amount);

    let newStatus = booking.status;
    if (newPaidAmount >= Number(booking.currentTotal)) {
      newStatus = "CONFIRMED";
    } else if (transaction.type === "ADVANCE" && newStatus === "AWAITING_PAYMENT") {
      newStatus = "ADVANCE_PAID";
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        totalPaid: newPaidAmount,
        status: newStatus,
      },
    });

    // Create or update Invoice
    const existingInvoice = await prisma.invoice.findFirst({
      where: { bookingId: booking.id },
    });

    const invoiceNumber = existingInvoice
      ? existingInvoice.invoiceNumber
      : `INV-${booking.bookingCode}`;

    await prisma.invoice.upsert({
      where: existingInvoice ? { id: existingInvoice.id } : { invoiceNumber },
      create: {
        invoiceNumber,
        bookingId: booking.id,
        customerName: user.name || "Mavon Customer",
        customerEmail: user.email || "customer@mavon.online",
        subtotal: booking.subtotal,
        taxAmount: booking.taxAmount,
        currentTotal: booking.currentTotal,
        totalPaid: newPaidAmount,
        status: newPaidAmount >= Number(booking.currentTotal) ? "PAID" : "PARTIALLY_PAID",
      },
      update: {
        status: newPaidAmount >= Number(booking.currentTotal) ? "PAID" : "PARTIALLY_PAID",
      },
    });

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("POST /api/payments/verify error:", error);
    return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 });
  }
}
