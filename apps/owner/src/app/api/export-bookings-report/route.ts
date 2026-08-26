import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';
import * as xlsx from 'xlsx';
import { requireAuth } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType, startDate, endDate, columns, format = 'excel' } = await req.json();

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json({ error: 'No columns selected' }, { status: 400 });
    }

    // Build query
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.checkIn = {};
      if (startDate) whereClause.checkIn.gte = new Date(startDate).toISOString();
      if (endDate) whereClause.checkIn.lte = new Date(endDate).toISOString();
    }

    if (reportType === 'refund') {
      whereClause.OR = [
        { status: { in: ['CANCELLED', 'PARTIALLY_CANCELLED', 'REFUNDED'] } },
        { pendingRefund: { gt: 0 } }
      ];
    } else if (reportType === 'cancellation') {
      whereClause.status = { in: ['CANCELLED', 'PARTIALLY_CANCELLED'] };
    }

    const includeOrderTransactions = reportType === 'audit' ? { orderBy: { srNo: 'asc' as const } } : { orderBy: { srNo: 'desc' as const }, take: 1 };

    // Fetch bookings with necessary relations
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        orderTransactions: includeOrderTransactions,
        user: true,
        villa: true
      },
      orderBy: { createdAt: 'desc' }
    });

    let reportData: any[] = [];

    if (reportType === 'audit') {
      // ⑤ Audit Report: Transaction-level, multiple rows per booking
      bookings.forEach(booking => {
        if (!booking.orderTransactions || booking.orderTransactions.length === 0) return;
        
        booking.orderTransactions.forEach(tx => {
          const row: any = {};
          if (columns.includes('orderId')) row['Order ID'] = booking.bookingCode;
          if (columns.includes('srNo')) row['Sr No.'] = tx.srNo;
          if (columns.includes('editTime')) row['Edit Time'] = new Date(tx.transactionTime).toLocaleString();
          if (columns.includes('action')) row['Action'] = tx.actionType;
          if (columns.includes('role')) row['Role'] = tx.actorRole;
          if (columns.includes('stateChange')) row['State Change'] = `${tx.previousState} -> ${tx.newState}`;
          
          if (columns.includes('checkInOut')) {
            const segments = Array.isArray(tx.snapshotStaySegments) ? tx.snapshotStaySegments : [];
            if (segments.length > 0) {
              row['Check In/Out'] = segments.map((s: any) => `${new Date(s.checkIn).toLocaleDateString()} to ${new Date(s.checkOut).toLocaleDateString()}`).join(', ');
            } else {
              row['Check In/Out'] = `${new Date(booking.checkIn).toLocaleDateString()} to ${new Date(booking.checkOut).toLocaleDateString()}`;
            }
          }
          
          if (columns.includes('guests')) {
            row['Guests'] = booking.totalGuests; // We fallback to booking guests since snapshot mapping might be complex
          }
          if (columns.includes('paymentType')) row['Payment Type'] = tx.paymentType;
          if (columns.includes('refundTier')) row['Refund Tier'] = tx.refundTier;
          if (columns.includes('refundStatus')) row['Refund Status'] = tx.refundStatus;
          if (columns.includes('services')) {
             const services = Array.isArray(tx.snapshotServices) ? tx.snapshotServices : [];
             row['Services'] = services.map((s: any) => s.serviceName || s.type).join(', ') || '-';
          }
          if (columns.includes('actionAmount')) row['Action Amount'] = Number(tx.orderValueDelta);
          if (columns.includes('balance')) row['Balance'] = Number(tx.balancePaymentDelta);
          if (columns.includes('totalPaid')) row['Total Paid'] = Number(tx.newTotalPaid);
          if (columns.includes('remainingAmount')) row['Remaining Amount'] = Number(tx.newRemainingAmount);
          if (columns.includes('refundAmount')) row['Refund Amount'] = Number(tx.refundDueDelta);
          if (columns.includes('refundPaid')) row['Refund Paid'] = Number(tx.refundPaidDelta);
          if (columns.includes('amountToBePaid')) row['Amount To Be Paid'] = Number(tx.newAmountToBePaid);

          reportData.push(row);
        });
      });
    } else {
      // Order-level reports (1 to 4)
      reportData = bookings.map(booking => {
        const row: any = {};
        const latestTx = booking.orderTransactions?.[0];

        // Shared or common fields mapped based on column
        if (columns.includes('orderId')) row['Order ID'] = booking.bookingCode;
        if (columns.includes('customer')) row['Customer'] = (booking.user?.firstName ? `${booking.user.firstName} ${booking.user.lastName}` : '') || booking.user?.email || booking.userId;
        if (columns.includes('villa')) row['Villa'] = booking.villa?.name || booking.villaId;
        if (columns.includes('checkIn')) row['Check-in'] = new Date(booking.checkIn).toLocaleDateString();
        if (columns.includes('checkOut')) row['Check-out'] = new Date(booking.checkOut).toLocaleDateString();
        if (columns.includes('guests')) row['Guests'] = booking.totalGuests;
        if (columns.includes('currentStatus')) row['Current Status'] = booking.status;
        if (columns.includes('bookingValue')) row['Booking Value'] = Number(booking.currentTotal);
        if (columns.includes('paid')) row['Paid'] = Number(booking.totalPaid);
        if (columns.includes('outstanding')) row['Outstanding'] = Number(booking.amountToBePaid) > 0 ? Number(booking.amountToBePaid) : 0;
        if (columns.includes('refundDue')) row['Refund Due'] = Number(booking.pendingRefund);
        if (columns.includes('refundPaid')) row['Refund Paid'] = Number(booking.totalRefunded);
        if (columns.includes('lastAction')) row['Last Action'] = latestTx?.actionType || '-';
        if (columns.includes('lastUpdated')) row['Last Updated'] = new Date(booking.updatedAt).toLocaleString();
        
        // Fields specific to Payment Report
        if (columns.includes('advanceExpected')) row['Advance Expected'] = Number(booking.currentTotal) / 2; // Assuming 50%
        if (columns.includes('advancePaid')) row['Advance Paid'] = Number(booking.totalAdvancePaid);
        if (columns.includes('additionalPayments')) row['Additional Payments'] = Number(booking.totalBalancePaid);
        if (columns.includes('totalPaid')) row['Total Paid'] = Number(booking.totalPaid);
        if (columns.includes('paymentStatus')) row['Payment Status'] = Number(booking.totalPaid) >= Number(booking.currentTotal) ? 'Paid' : 'Pending';

        // Fields specific to Refund & Cancellation Report
        if (columns.includes('cancellationDate')) row['Cancellation Date'] = latestTx?.actionType.includes('CANCEL') ? new Date(latestTx.transactionTime).toLocaleString() : '-';
        if (columns.includes('cancelledBy')) row['Cancelled By'] = latestTx?.actionType.includes('CANCEL') ? latestTx.actorRole : '-';
        if (columns.includes('originalPaidAmount')) row['Original Paid Amount'] = Number(latestTx?.previousTotalPaid || booking.totalPaid);
        if (columns.includes('refundTier')) row['Refund Tier'] = latestTx?.refundTier || '-';
        if (columns.includes('refundStatus')) row['Refund Status'] = latestTx?.refundStatus || '-';
        if (columns.includes('refundAmount')) row['Refund Amount'] = Number(booking.cancellationRefund || (Number(booking.pendingRefund) + Number(booking.totalRefunded)));
        if (columns.includes('pendingRefund')) row['Pending Refund'] = Number(booking.pendingRefund);
        
        if (columns.includes('bookingDates')) row['Booking Dates'] = `${new Date(booking.checkIn).toLocaleDateString()} to ${new Date(booking.checkOut).toLocaleDateString()}`;
        if (columns.includes('cancelledAt')) row['Cancelled At'] = latestTx?.actionType.includes('CANCEL') ? new Date(latestTx.transactionTime).toLocaleString() : '-';
        if (columns.includes('cancellationReason')) row['Cancellation Reason'] = '-'; // Assuming reason is in metadata, leave blank or dash for now
        if (columns.includes('amountPaid')) row['Amount Paid'] = Number(booking.totalPaid);
        if (columns.includes('refundEligible')) row['Refund Eligible'] = Number(booking.cancellationRefund) > 0 ? 'Yes' : 'No';

        return row;
      });
    }

    if (format === 'json') {
      return NextResponse.json({ data: reportData });
    }

    // Generate Excel file
    const worksheet = xlsx.utils.json_to_sheet(reportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, `${reportType} Report`);

    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${reportType}_report_${new Date().getTime()}.xlsx"`
      }
    });
  } catch (error: any) {
    console.error('Error generating bookings report:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
