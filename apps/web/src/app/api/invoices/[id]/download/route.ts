import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@villa-platform/database";
import { getAuthUser } from "@villa-platform/auth/permissions";
import { generateInvoicePdfBuffer } from "@villa-platform/invoice";
import { format } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            villa: true,
          }
        },
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    // Authorization: User must be ADMIN/STAFF or the customer who owns the booking
    if (!user || (user.id !== invoice.booking.userId && !["SUPER_ADMIN", "ADMIN", "STAFF"].includes(user.role))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Generate PDF on the fly
    const pdfBuffer = await generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      date: format(invoice.issuedAt || invoice.createdAt, "dd MMM yyyy"),
      dueDate: format(new Date(invoice.booking.checkIn), "dd MMM yyyy"),
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone || undefined,
      bookingCode: invoice.booking.bookingCode,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      currentTotal: Number(invoice.currentTotal),
      totalPaid: Number(invoice.totalPaid),
      items: [
        {
          description: `Villa Stay (${invoice.booking.villa.name}) - ${format(new Date(invoice.booking.checkIn), 'dd MMM')} to ${format(new Date(invoice.booking.checkOut), 'dd MMM')}`,
          quantity: 1,
          rate: Number(invoice.subtotal),
          amount: Number(invoice.subtotal),
        }
      ]
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("GET /api/invoices/[id]/download error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate invoice" }, { status: 500 });
  }
}
