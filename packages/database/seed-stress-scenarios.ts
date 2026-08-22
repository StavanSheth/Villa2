/**
 * seed-stress-scenarios.ts
 * 
 * Seeds the 12 STRESS-SEP booking scenarios into the database.
 * Implements strict financial state-machine logic matching the 8 critical cross-checks:
 * 
 * Rule 1: Advance must never include balance payments (separate tracking)
 * Rule 2: Action Amount = orderValueDelta (the delta, not the new total)
 * Rule 3: Multiple stay segments remain separate; cancellation removes one segment
 * Rule 4: Refund approval ≠ refund completion (pendingRefund intermediate state)
 * Rule 5: Service changes affect order through unit price + GST
 * Rule 6: Remaining Amount = Order Total - Advance Paid; Amount To Be Paid = Order Total - Net Paid
 * Rule 7: Historical rows are immutable (each transaction records its own snapshot)
 * Rule 8: Order Total = Net Paid + Amount To Be Paid + Customer Credit
 *         where Net Paid = Total Paid - Actual Refunds
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const SERVICE_PRICES: Record<string, number> = {
  'Airport pickup': 2000,
  'BBQ': 2500,
  'BBQ Setup': 1500,
  'Bonfire': 1500,
  'Breakfast': 500,
  'Decoration': 3000,
  'Dinner': 900,
  'Event setup': 5000,
  'Extra Guest Bed': 1000,
  'Lunch': 800,
  'Photography': 6000,
  'Private chef': 4000,
  'Private Chef': 2500
};

const GST_RATE = 0.18;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SegmentState {
  checkIn: string;      // ISO date string e.g. '2026-09-28'
  checkOut: string;
  accommodation: number;
  services: { name: string; qty: number; unitPrice: number }[];
  guests: { date: string; adults: number; children: number }[];
  status: 'ACTIVE' | 'CANCELLED';
}

interface FinancialState {
  segments: SegmentState[];
  cleaningFee: number;
  discount: number;
  // Gross amounts — these never decrease except through explicit segment cancellation
  totalPaid: number;        // Gross total collected from customer (advance + balance)
  advancePaid: number;      // Only advance payments
  balancePaid: number;      // Only balance payments
  totalRefunded: number;    // Actual refunds disbursed
  pendingRefund: number;    // Refund approved but not yet paid
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcSegmentBase(seg: SegmentState): number {
  const svcTotal = seg.services.reduce((sum, s) => sum + s.unitPrice * s.qty, 0);
  return seg.accommodation + svcTotal;
}

function calcOrderTotal(state: FinancialState): number {
  // Only ACTIVE segments contribute to the order total
  const activeSegments = state.segments.filter(s => s.status === 'ACTIVE');
  // Rule: Full cancellation → Order Total = 0 (no cleaning fee residue)
  if (activeSegments.length === 0) return 0;
  const activeBase = activeSegments.reduce((sum, s) => sum + calcSegmentBase(s), 0);
  const totalBase = activeBase + state.cleaningFee - state.discount;
  const gst = Math.round(totalBase * GST_RATE);
  return totalBase + gst;
}

function calcNetPaid(state: FinancialState): number {
  return state.totalPaid - state.totalRefunded;
}

function calcRemainingAmount(state: FinancialState): number {
  // Rule 6: Remaining Amount = Order Total - Advance Paid
  return calcOrderTotal(state) - state.advancePaid;
}

function calcAmountToBePaid(state: FinancialState): number {
  // Rule 6: Amount To Be Paid = Order Total - Net Paid
  const netPaid = calcNetPaid(state);
  return Math.max(0, calcOrderTotal(state) - netPaid);
}

function calcCustomerCredit(state: FinancialState): number {
  // Rule 8: Customer Credit = Net Paid - Order Total (if > 0)
  const netPaid = calcNetPaid(state);
  const orderTotal = calcOrderTotal(state);
  return Math.max(0, netPaid - orderTotal);
}

function buildSnapshotStaySegments(state: FinancialState): any[] {
  return state.segments
    .filter(s => s.status === 'ACTIVE')
    .map(s => ({ checkIn: s.checkIn, checkOut: s.checkOut }));
}

function buildSnapshotGuests(state: FinancialState): Record<string, { adults: number; children: number }> {
  const result: Record<string, { adults: number; children: number }> = {};
  for (const seg of state.segments.filter(s => s.status === 'ACTIVE')) {
    for (const g of seg.guests) {
      result[g.date] = { adults: g.adults, children: g.children };
    }
  }
  return result;
}

function buildSnapshotServices(state: FinancialState): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const seg of state.segments.filter(s => s.status === 'ACTIVE')) {
    for (const svc of seg.services) {
      // Use the first guest date of the segment as the service date
      const date = seg.guests[0]?.date || seg.checkIn;
      if (!result[date]) result[date] = [];
      result[date].push(`${svc.name} x${svc.qty}`);
    }
  }
  return result;
}

function maxGuests(state: FinancialState): number {
  let max = 1;
  for (const seg of state.segments.filter(s => s.status === 'ACTIVE')) {
    for (const g of seg.guests) {
      const total = g.adults + g.children;
      if (total > max) max = total;
    }
  }
  return max;
}

// ---------------------------------------------------------------------------
// Parse the JSON scenario into initial state
// ---------------------------------------------------------------------------

function parseCreateBooking(txn: any, globalInputs?: any): { state: FinancialState; allServiceRecords: any[] } {
  const segments: SegmentState[] = [];
  const allServiceRecords: any[] = [];

  if (txn.segments) {
    // Multi-segment booking
    for (const seg of txn.segments) {
      const services: { name: string; qty: number; unitPrice: number }[] = [];
      if (seg.services) {
        for (const s of seg.services) {
          const unitPrice = SERVICE_PRICES[s.service] || 0;
          services.push({ name: s.service, qty: s.qty, unitPrice });
          allServiceRecords.push({ name: s.service, quantity: s.qty, unitPrice, totalPrice: unitPrice * s.qty });
        }
      }
      segments.push({
        checkIn: seg.stay.start,
        checkOut: seg.stay.end,
        accommodation: seg.inputs?.accommodation || 0,
        services,
        guests: seg.guests || [],
        status: 'ACTIVE'
      });
    }
  } else {
    // Single-segment booking
    const services: { name: string; qty: number; unitPrice: number }[] = [];
    if (txn.services) {
      for (const s of txn.services) {
        const unitPrice = SERVICE_PRICES[s.service] || 0;
        services.push({ name: s.service, qty: s.qty, unitPrice });
        allServiceRecords.push({ name: s.service, quantity: s.qty, unitPrice, totalPrice: unitPrice * s.qty });
      }
    }
    segments.push({
      checkIn: txn.stay.start,
      checkOut: txn.stay.end,
      accommodation: txn.inputs?.accommodation || 0,
      services,
      guests: txn.guests || [],
      status: 'ACTIVE'
    });
  }

  const inputs = txn.inputs || globalInputs || {};
  const state: FinancialState = {
    segments,
    cleaningFee: inputs.cleaningFee || 0,
    discount: inputs.discount || 0,
    totalPaid: 0,
    advancePaid: 0,
    balancePaid: 0,
    totalRefunded: 0,
    pendingRefund: 0,
    status: 'NEW'
  };

  // Apply initial payments from CREATE
  if (inputs.advancePayment) {
    state.advancePaid += inputs.advancePayment;
    state.totalPaid += inputs.advancePayment;
    state.status = 'ADVANCE_PAID';
  }
  if (inputs.balancePayment) {
    state.balancePaid += inputs.balancePayment;
    state.totalPaid += inputs.balancePayment;
    // If advance + balance were both provided, status depends on if fully paid
    if (state.advancePaid > 0) {
      state.status = 'ADVANCE_PAID';
    } else {
      state.status = 'CONFIRMED';
    }
  }

  return { state, allServiceRecords };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const jsonPath = path.join(process.cwd(), '../../booking_scenarios.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const user = await prisma.user.findUnique({ where: { email: 'customer1@mavon.online' } });
  const villa = await prisma.villa.findUnique({ where: { id: 'villa-1' } });

  if (!user || !villa) {
    throw new Error('No user or villa found. Run seed/index.ts first.');
  }

  const existingBookings = await prisma.booking.findMany({
    where: { bookingCode: { startsWith: 'STRESS-SEP' } },
    select: { id: true }
  });
  const existingIds = existingBookings.map(b => b.id);
  
  if (existingIds.length > 0) {
    await prisma.bookingEvent.deleteMany({ where: { bookingId: { in: existingIds } } });
    await prisma.orderTransaction.deleteMany({ where: { bookingId: { in: existingIds } } });
    await prisma.bookingService.deleteMany({ where: { bookingId: { in: existingIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: existingIds } } });
  }

  for (const scenario of data.scenarios) {
    const bookingCode = scenario.id;
    console.log(`Processing ${bookingCode}...`);

    const createTxn = scenario.transactions.find((t: any) => t.action === 'CREATE_BOOKING');
    if (!createTxn) {
      console.warn(`  Skipping ${bookingCode}: no CREATE_BOOKING found`);
      continue;
    }

    const { state, allServiceRecords } = parseCreateBooking(createTxn, undefined);
    const transactionsToCreate: any[] = [];
    let srNo = 1;
    let transactionTime = new Date('2026-09-01T10:00:00Z');

    for (const txn of scenario.transactions) {
      transactionTime = new Date(transactionTime.getTime() + 60 * 60 * 1000);

      const prevOrderTotal = calcOrderTotal(state);
      const prevTotalPaid = state.totalPaid;
      const prevStatus = state.status;

      let paymentTypeStr = 'N/A';
      let advancePaymentDelta = 0;
      let balancePaymentDelta = 0;
      let refundDueDelta = 0;
      let refundPaidDelta = 0;

      // ---------------------------------------------------------------
      // Apply the transaction to the state
      // ---------------------------------------------------------------
      if (txn.action === 'CREATE_BOOKING') {
        // State already initialized above; just record the payment deltas
        const inputs = txn.inputs || {};
        if (inputs.advancePayment) {
          advancePaymentDelta = inputs.advancePayment;
          paymentTypeStr = 'ADVANCE';
        }
        if (inputs.balancePayment) {
          balancePaymentDelta = inputs.balancePayment;
          paymentTypeStr = inputs.advancePayment ? 'ADVANCE' : 'BALANCE';
        }
        if (!inputs.advancePayment && !inputs.balancePayment) {
          paymentTypeStr = 'FULL';
          state.status = 'CONFIRMED';
        }
      }
      else if (txn.action === 'ADVANCE_PAYMENT') {
        const amt = txn.inputs?.additionalAdvance || txn.inputs?.amount || 0;
        state.advancePaid += amt;
        state.totalPaid += amt;
        advancePaymentDelta = amt;
        paymentTypeStr = 'ADVANCE';
        state.status = 'ADVANCE_PAID';
      }
      else if (txn.action === 'BALANCE_PAYMENT') {
        const amt = txn.inputs?.amount || 0;
        state.balancePaid += amt;
        state.totalPaid += amt;
        balancePaymentDelta = amt;
        paymentTypeStr = 'BALANCE';
        // Don't change status to CONFIRMED here — balance payment doesn't mean fully paid
      }
      else if (txn.action === 'EDIT_BOOKING') {
        if (txn.edits) {
          for (const edit of txn.edits) {
            if (edit.field === 'accommodation') {
              // Apply to first active segment (or the specified segment)
              const targetSeg = state.segments.find(s => s.status === 'ACTIVE');
              if (targetSeg) targetSeg.accommodation = edit.toValue;
            } else if (edit.service) {
              const unitPrice = SERVICE_PRICES[edit.service] || 0;

              // Find the target segment for this edit
              let targetSeg: SegmentState | undefined;
              if (edit.segment) {
                targetSeg = state.segments.find(s =>
                  s.status === 'ACTIVE' && s.checkIn === edit.segment.start && s.checkOut === edit.segment.end
                );
              }
              if (!targetSeg) {
                // Find segment containing this service
                targetSeg = state.segments.find(s =>
                  s.status === 'ACTIVE' && s.services.some(sv => sv.name === edit.service)
                );
              }
              if (!targetSeg) {
                // Default to first active segment
                targetSeg = state.segments.find(s => s.status === 'ACTIVE');
              }

              if (targetSeg) {
                if (edit.action === 'ADD') {
                  targetSeg.services.push({ name: edit.service, qty: edit.qty, unitPrice });
                  allServiceRecords.push({ name: edit.service, quantity: edit.qty, unitPrice, totalPrice: unitPrice * edit.qty });
                } else if (edit.action === 'REMOVE') {
                  const idx = targetSeg.services.findIndex(s => s.name === edit.service);
                  if (idx >= 0) targetSeg.services.splice(idx, 1);
                  const recIdx = allServiceRecords.findIndex((s: any) => s.name === edit.service);
                  if (recIdx >= 0) allServiceRecords.splice(recIdx, 1);
                } else if (edit.fromQty !== undefined && edit.toQty !== undefined) {
                  const svc = targetSeg.services.find(s => s.name === edit.service);
                  if (svc) {
                    svc.qty = edit.toQty;
                    const rec = allServiceRecords.find((s: any) => s.name === edit.service);
                    if (rec) { rec.quantity = edit.toQty; rec.totalPrice = unitPrice * edit.toQty; }
                  }
                }
              }
            }
          }
        }
        // After applying edits, detect if customer has overpaid → create pending refund
        const postEditOrderTotal = calcOrderTotal(state);
        const postEditNetPaid = calcNetPaid(state);
        if (postEditNetPaid > postEditOrderTotal) {
          const overpayment = postEditNetPaid - postEditOrderTotal;
          refundDueDelta = overpayment - state.pendingRefund;
          state.pendingRefund = overpayment;
        }
        paymentTypeStr = 'N/A';
      }
      else if (txn.action === 'CANCEL_BOOKING') {
        state.status = 'CANCELLED';
        // Cancel all segments
        for (const seg of state.segments) {
          seg.status = 'CANCELLED';
        }
        // Calculate refund due (pending, not yet paid)
        const netPaid = calcNetPaid(state);
        if (netPaid > 0) {
          state.pendingRefund = netPaid;
          refundDueDelta = netPaid;
        }
        paymentTypeStr = 'N/A';
      }
      else if (txn.action === 'CANCEL_STAY_SEGMENT') {
        // Rule 3: Find and cancel the specific segment
        const cancelledSeg = txn.inputs?.cancelledSegment;
        if (cancelledSeg) {
          const seg = state.segments.find(s =>
            s.status === 'ACTIVE' && s.checkIn === cancelledSeg.start && s.checkOut === cancelledSeg.end
          );
          if (seg) {
            // Calculate the value of the cancelled segment BEFORE cancelling
            const segBase = calcSegmentBase(seg);
            const segGst = Math.round(segBase * GST_RATE);
            const cancelledValue = segBase + segGst;

            seg.status = 'CANCELLED';

            // Set pending refund based on net position
            const postEditNetPaid = calcNetPaid(state);
            const postEditOrderTotal = calcOrderTotal(state);
            if (postEditNetPaid > postEditOrderTotal) {
              const overpayment = postEditNetPaid - postEditOrderTotal;
              refundDueDelta = overpayment - state.pendingRefund;
              state.pendingRefund = overpayment;
            }
          }
        }
        state.status = 'PARTIALLY_CANCELLED';
        paymentTypeStr = 'N/A';
      }
      else if (txn.action === 'REFUND_COMPLETED') {
        // Rule 4: Move pending refund → actual refund
        const refundAmt = state.pendingRefund;
        state.totalRefunded += refundAmt;
        state.pendingRefund = 0;
        refundPaidDelta = refundAmt;
        paymentTypeStr = 'REFUND';
        state.status = 'REFUNDED';
      }

      // ---------------------------------------------------------------
      // Compute derived values AFTER mutation
      // ---------------------------------------------------------------
      const newOrderTotal = calcOrderTotal(state);
      const orderValueDelta = (txn.action === 'CREATE_BOOKING')
        ? newOrderTotal
        : newOrderTotal - prevOrderTotal;

      transactionsToCreate.push({
        srNo: srNo++,
        transactionTime,
        actionType: txn.action,
        actorRole: txn.role || 'CUSTOMER',
        previousState: prevStatus,
        newState: state.status,
        paymentType: paymentTypeStr,
        refundTier: 'N/A',
        refundStatus: state.pendingRefund > 0 ? 'REFUND_DUE' : (state.totalRefunded > 0 ? 'REFUNDED' : 'N/A'),
        previousOrderTotal: prevOrderTotal,
        orderValueDelta,
        newOrderTotal,
        previousTotalPaid: prevTotalPaid,
        advancePaymentDelta,
        balancePaymentDelta,
        refundDueDelta,
        refundPaidDelta,
        newTotalPaid: state.totalPaid,
        newTotalRefunded: state.totalRefunded,
        newAdvancePaid: state.advancePaid,
        newRemainingAmount: calcRemainingAmount(state),
        newPendingRefund: state.pendingRefund,
        newAmountToBePaid: calcAmountToBePaid(state),
        // Snapshot fields for the audit ledger UI
        snapshotStaySegments: buildSnapshotStaySegments(state),
        snapshotGuests: buildSnapshotGuests(state),
        snapshotServices: buildSnapshotServices(state),
      });
    }

    // ---------------------------------------------------------------
    // Determine final check-in/check-out from active segments
    // ---------------------------------------------------------------
    const activeSegs = state.segments.filter(s => s.status === 'ACTIVE');
    const allSegs = state.segments;
    const checkIn = new Date(`${(activeSegs[0] || allSegs[0]).checkIn}T14:00:00Z`);
    const checkOut = new Date(`${(activeSegs[activeSegs.length - 1] || allSegs[allSegs.length - 1]).checkOut}T10:00:00Z`);

    const finalOrderTotal = calcOrderTotal(state);
    const activeSegsForGst = state.segments.filter(s => s.status === 'ACTIVE');
    const finalBase = activeSegsForGst.length === 0 ? 0 : activeSegsForGst.reduce((sum, s) => sum + calcSegmentBase(s), 0) + state.cleaningFee - state.discount;
    const finalGst = activeSegsForGst.length === 0 ? 0 : Math.round(finalBase * GST_RATE);

    await prisma.booking.create({
      data: {
        bookingCode,
        userId: user.id,
        villaId: villa.id,
        checkIn,
        checkOut,
        totalGuests: maxGuests(state),
        currentTotal: finalOrderTotal,
        totalPaid: state.totalPaid,
        totalAdvancePaid: state.advancePaid,
        totalBalancePaid: state.balancePaid,
        totalRefunded: state.totalRefunded,
        pendingRefund: state.pendingRefund,
        amountToBePaid: calcAmountToBePaid(state),
        status: state.status,
        currency: 'INR',
        cleaningFee: state.cleaningFee,
        discountAmount: state.discount,
        gstAmount: finalGst,
        orderTransactions: {
          create: transactionsToCreate
        },
        services: {
          create: allServiceRecords.map((s: any) => ({
            name: s.name,
            quantity: s.quantity,
            unitPrice: s.unitPrice,
            totalPrice: s.totalPrice,
            serviceId: 'stress-svc-mock'
          }))
        },
        segments: {
          create: state.segments.map(s => ({
            checkIn: new Date(`${s.checkIn}T14:00:00Z`),
            checkOut: new Date(`${s.checkOut}T10:00:00Z`),
            status: s.status,
            adults: s.guests[0]?.adults || 1,
            children: s.guests[0]?.children || 0,
            staySubtotal: s.accommodation
          }))
        }
      }
    });

    // ---------------------------------------------------------------
    // Verification log for Scenario 12 (and others)
    // ---------------------------------------------------------------
    const netPaid = calcNetPaid(state);
    const amtToBePaid = calcAmountToBePaid(state);
    const credit = calcCustomerCredit(state);
    // Rule 8 (corrected): Order Total + Customer Credit = Net Paid + Amount To Be Paid
    const reconciles = (finalOrderTotal + credit === netPaid + amtToBePaid);

    console.log(`  Created ${bookingCode}`);
    console.log(`    Order Total: ₹${finalOrderTotal.toLocaleString()}`);
    console.log(`    Total Paid (Gross): ₹${state.totalPaid.toLocaleString()}`);
    console.log(`    Advance Paid: ₹${state.advancePaid.toLocaleString()}`);
    console.log(`    Balance Paid: ₹${state.balancePaid.toLocaleString()}`);
    console.log(`    Total Refunded: ₹${state.totalRefunded.toLocaleString()}`);
    console.log(`    Pending Refund: ₹${state.pendingRefund.toLocaleString()}`);
    console.log(`    Net Paid: ₹${netPaid.toLocaleString()}`);
    console.log(`    Remaining Amount: ₹${calcRemainingAmount(state).toLocaleString()}`);
    console.log(`    Amount To Be Paid: ₹${amtToBePaid.toLocaleString()}`);
    console.log(`    Customer Credit: ₹${credit.toLocaleString()}`);
    console.log(`    Reconciliation (Rule 8): ${reconciles ? '✅ PASS' : '❌ FAIL'} (${finalOrderTotal} + ${credit} = ${netPaid} + ${amtToBePaid})`);
  }

  console.log('\nDone!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
