// apps/booking/src/app/api/bookings/[id]/route.ts
// Single booking: GET (with all relations) + PATCH (state transitions via FSM)

import { NextResponse } from 'next/server';
import { prisma, validateTransition, validateSideAction, calculateBookingPrice } from '@villa-platform/database';
import { calcOrderTotal, calcNetPaid, FinancialState } from '../../../../../../../packages/database/queries/financial-engine';
import type { RoleName } from '@villa-platform/database';
import { razorpayClient } from '@villa-platform/payments';
import { authenticateApiRequest } from '@villa-platform/middleware';
import crypto from 'node:crypto';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const auth = await authenticateApiRequest(_req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { bookingCode: id },
      include: {
        user: true,
        villa: { include: { pricingRules: true } },
        services: true,
        events: { orderBy: { createdAt: 'asc' } },
        transactions: { orderBy: { createdAt: 'desc' } },
        orderTransactions: { orderBy: { srNo: 'desc' } },
        segments: true,
        promoCode: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // ── SECURITY: IDOR Check ──
    if (auth.role === 'CUSTOMER' && booking.userId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden - Access Denied' }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('GET booking error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const auth = await authenticateApiRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, actorRole, metadata } = body as {
      action: string;
      actorRole: RoleName;
      metadata?: Record<string, unknown>;
    };

    let resolvedRole = auth.role as string;
    let resolvedUserId = auth.uid;

    // ── SECURITY: IDOR Check for actions that modify the booking ──
    if (resolvedRole === 'CUSTOMER') {
      const existingBooking = await prisma.booking.findUnique({ where: { bookingCode: id }, select: { userId: true } });
      if (!existingBooking || existingBooking.userId !== resolvedUserId) {
        return NextResponse.json({ error: 'Forbidden - Access Denied' }, { status: 403 });
      }
    }

    if (action === 'CANCEL' || action === 'CANCEL_STAY_SEGMENT') {
      const { CancellationService } = await import('@villa-platform/bookings');
      const result = await CancellationService.cancelBooking({
        bookingId: id,
        action: action,
        actorRole: resolvedRole,
        actorId: resolvedUserId,
        metadata: metadata
      });
      return NextResponse.json({ success: true, booking: result.booking });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. SELECT ... FOR UPDATE
      const bookings = await tx.$queryRaw<any[]>`
        SELECT 
          id, status, "villaId", "checkIn", "checkOut", 
          "currentTotal", "totalPaid", "totalAdvancePaid", "totalBalancePaid", 
          "totalRefunded", "pendingRefund", "amountToBePaid"
        FROM "Booking" 
        WHERE "bookingCode" = ${id} 
        FOR UPDATE
      `;

      if (bookings.length === 0) {
        throw new Error('Booking not found');
      }

      const booking = bookings[0];

      // 2. Load previous financial state
      let previousOrderTotal = Number(booking.currentTotal || 0);
      let previousTotalPaid = Number(booking.totalPaid || 0);
      let previousAdvancePaid = Number(booking.totalAdvancePaid || 0);
      let previousBalancePaid = Number(booking.totalBalancePaid || 0);
      let previousTotalRefunded = Number(booking.totalRefunded || 0);
      let previousPendingRefund = Number(booking.pendingRefund || 0);
      let previousAmountToBePaid = Number(booking.amountToBePaid || 0);

      // 3. FSM Validation
      let newState = booking.status;
      const fsmResult = validateTransition(booking.status, action as any, resolvedRole);
      
      if (!fsmResult.valid) {
        const sideResult = validateSideAction(booking.status, action as any, resolvedRole);
        if (!sideResult.valid) {
          throw new Error(fsmResult.error || sideResult.error || 'Invalid action for this state');
        }
      } else {
        newState = fsmResult.newState!;
      }

      let orderValueDelta = 0;
      let advancePaymentDelta = 0;
      let balancePaymentDelta = 0;
      let refundDueDelta = 0;
      let refundPaidDelta = 0;

      let refundTier = 'N/A';
      let refundStatus = 'N/A';
      let paymentType = 'N/A';

      let updateData: any = { 
        status: newState
      };

      // 4. Handle EDIT and SERVICE updates
      if ((action === 'EDIT_BOOKING' || action === 'EDIT_DATES' || action === 'ADD_SERVICE' || action === 'REMOVE_SERVICE') && metadata) {
        if (metadata.checkIn) updateData.checkIn = new Date(metadata.checkIn as string);
        if (metadata.checkOut) updateData.checkOut = new Date(metadata.checkOut as string);
        if (metadata.totalGuests) updateData.totalGuests = Number(metadata.totalGuests);

        const allServiceDefs = await tx.serviceDef.findMany({ where: { isActive: true } });
        const reqServices = ((metadata.selectedServices as any[]) || []).map((s: { serviceDefId: string; quantity?: number }) => {
          const def = allServiceDefs.find((d) => d.id === s.serviceDefId);
          if (!def) return null;
          return {
            serviceId: def.id,
            name: def.name,
            price: Number(def.price),
            chargeType: def.chargeType,
            quantity: s.quantity || 1,
            type: def.type
          };
        }).filter(Boolean);

        const villa = await tx.villa.findUnique({
          where: { id: booking.villaId },
          include: { pricingRules: true }
        });

        if (villa) {
          const newStart = updateData.checkIn || new Date(booking.checkIn);
          const newEnd = updateData.checkOut || new Date(booking.checkOut);
          const newGuests = updateData.totalGuests || booking.totalGuests;
          
          const pricing = await calculateBookingPrice({
            checkIn: newStart,
            checkOut: newEnd,
            selectedDates: metadata.selectedDates as string[] | undefined,
            pricingRules: villa.pricingRules,
            services: reqServices as any[],
            guests: newGuests,
            dailyGuestsCount: metadata.dailyGuestsCount as any,
          });

          orderValueDelta = pricing.total - previousOrderTotal;
          updateData.currentTotal = pricing.total;
          updateData.nightlyBreakdown = pricing.nightlyBreakdown;
          updateData.servicesSnapshot = pricing.serviceBreakdown;
          updateData.gstAmount = pricing.gst;
          updateData.cleaningFee = pricing.cleaningFee;

          // Handle payment during edit: if order value increased and paymentType specified
          if (metadata.paymentType && orderValueDelta > 0) {
            paymentType = String(metadata.paymentType);
            if (paymentType === 'ADVANCE') {
              advancePaymentDelta = Math.round(orderValueDelta * 0.33);
            } else {
              // FULL or BALANCE: customer pays the full increase
              balancePaymentDelta = orderValueDelta;
            }
          } else if (metadata.paymentType) {
            paymentType = String(metadata.paymentType);
          }

          // Handle overpayment when order value decreased (legacy path)
          // If the customer has paid more than the new order total, record a pending refund
          if (orderValueDelta < 0) {
            const newTotal = previousOrderTotal + orderValueDelta;
            const netPaid = previousTotalPaid - previousTotalRefunded;
            if (netPaid > newTotal) {
              const overpayment = netPaid - newTotal;
              refundDueDelta = overpayment - previousPendingRefund; // Only add the net new overpayment
              refundStatus = 'DUE';
            }
          }
        }

        // --- ADVANCED ENGINE INTEGRATION FOR EDITS ---
        if (metadata.stateForEngine) {
          const state = metadata.stateForEngine as FinancialState;
          const postEditOrderTotal = calcOrderTotal(state);
          const postEditNetPaid = calcNetPaid(state);
          
          orderValueDelta = postEditOrderTotal - previousOrderTotal;
          updateData.currentTotal = postEditOrderTotal;

          if (postEditNetPaid > postEditOrderTotal) {
            const overpayment = postEditNetPaid - postEditOrderTotal;
            refundDueDelta = overpayment - previousPendingRefund;
            updateData.pendingRefund = overpayment;
          }
        }
      }

      // 4b. Handle Partial Cancellation
      if (action === 'CANCEL_STAY_SEGMENT' && metadata?.stateForEngine) {
         const state = metadata.stateForEngine as FinancialState;
         const newOrderTotal = calcOrderTotal(state);
         const cancelledValue = previousOrderTotal - newOrderTotal;
         
         orderValueDelta = -cancelledValue;
         
         const postEditNetPaid = previousTotalPaid - previousTotalRefunded;
         if (postEditNetPaid > newOrderTotal) {
           const overpayment = postEditNetPaid - newOrderTotal;
           refundDueDelta = overpayment - previousPendingRefund;
           updateData.pendingRefund = overpayment;
         }
         updateData.currentTotal = newOrderTotal;
      }

      // 5. Handle Cancellations & Refunds
      if (action === 'CANCEL') {
        let refundAmount = 0;
        
        // Advanced engine logic: full cancellation zeroes order total
        if (metadata && metadata.stateForEngine) {
           const state = metadata.stateForEngine as FinancialState;
           const newOrderTotal = calcOrderTotal(state); // Should be 0
           orderValueDelta = newOrderTotal - previousOrderTotal;
           updateData.currentTotal = newOrderTotal;
           
           if (previousTotalPaid > 0) {
             refundAmount = previousTotalPaid; // 100% refund for mock test
           }
        } else if (previousTotalPaid > 0) {
          // Legacy logic
          const checkInDate = new Date(booking.checkIn);
          const msRemaining = checkInDate.getTime() - Date.now();
          const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

          if (daysRemaining >= 14) {
            refundAmount = previousTotalPaid;
            refundTier = '>14';
          } else if (daysRemaining >= 7) {
            refundAmount = previousTotalPaid * 0.5;
            refundTier = '7-14';
          } else {
            refundTier = '<7';
          }
        }

        if (refundAmount > 0) {
          refundDueDelta = refundAmount;
          refundStatus = 'DUE';
          
          updateData.refundPolicySnapshot = {
            status: 'PENDING_OWNER_SELECTION',
            amount: refundAmount,
            tier: refundTier,
            idempotencyKey: `refund-${booking.id}-${Date.now()}`
          };
        } else {
          refundStatus = 'NO_REFUND';
        }
      }

      // 6. Handle Payments
      if (action === 'PAYMENT' && metadata) {
        const amt = Number(metadata.amount || 0);
        if (metadata.paymentType === 'ADVANCE') {
          advancePaymentDelta = amt;
          paymentType = 'ADVANCE';
        } else {
          balancePaymentDelta = amt;
          paymentType = 'BALANCE';
        }
      }

      // 7. Handle Actual Refund Given (Customer gets money back)
      if ((action === 'ISSUE_REFUND' || action === 'REFUND_PROCESSED_MANUAL' || action === 'REFUND_PROCESSED') && metadata) {
        refundPaidDelta = Number(metadata.amount || metadata.refundAmount || 0);
      }

      // 8. Calculate New Financial State
      const newOrderTotal = previousOrderTotal + orderValueDelta;
      
      const newAdvancePaid = previousAdvancePaid + advancePaymentDelta;
      const newBalancePaid = previousBalancePaid + balancePaymentDelta;
      
      const newTotalPaid = newAdvancePaid + newBalancePaid;
      
      const newTotalRefunded = previousTotalRefunded + refundPaidDelta;
      let newPendingRefund = previousPendingRefund + refundDueDelta - refundPaidDelta;
      
      const netPaidPosition = newTotalPaid - newTotalRefunded;
      const settlementDifference = newOrderTotal - netPaidPosition;
      
      const newAmountToBePaid = Math.max(0, settlementDifference);
      const refundDue = Math.max(0, -settlementDifference);

      // Ensure pendingRefund is at least the computed refundDue
      // This catches cases where refundDueDelta wasn't set explicitly
      if (refundDue > newPendingRefund) {
        newPendingRefund = refundDue;
      }

      updateData.currentTotal = newOrderTotal;
      updateData.totalPaid = newTotalPaid;
      updateData.totalAdvancePaid = newAdvancePaid;
      updateData.totalBalancePaid = newBalancePaid;
      updateData.totalRefunded = newTotalRefunded;
      updateData.pendingRefund = newPendingRefund;
      updateData.amountToBePaid = newAmountToBePaid;

      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: updateData,
      });

      // 9. Build snapshots from current booking state
      const snapshotStaySegments: any[] = [];
      const snapshotGuests: Record<string, any> = {};
      const snapshotServices: Record<string, any> = {};

      if (metadata && metadata.stateForEngine) {
        // Advanced engine state provided - use it to build perfect snapshots
        const state = metadata.stateForEngine as FinancialState;
        for (const seg of state.segments) {
          snapshotStaySegments.push({ checkIn: seg.checkIn, checkOut: seg.checkOut });
          
          if (seg.guests && seg.guests.length > 0) {
             const g = seg.guests[0];
             snapshotGuests[seg.checkIn] = { adults: g.adults, children: g.children };
          }
          
          if (seg.services && seg.services.length > 0) {
             snapshotServices[seg.checkIn] = seg.services.map((s: any) => `${s.name} ×${s.qty}`);
          }
        }
      } else {
        // Legacy fallback
        // Build stay segments from the updated dates
        const finalCheckIn = updateData.checkIn || new Date(booking.checkIn);
        const finalCheckOut = updateData.checkOut || new Date(booking.checkOut);
        const finalGuests = updateData.totalGuests || 2;

        if (updateData.nightlyBreakdown && Array.isArray(updateData.nightlyBreakdown)) {
          // Group nightly breakdown into contiguous segments
          const dates = updateData.nightlyBreakdown.map((n: any) => n.date).sort();
          if (dates.length > 0) {
            let segStart = dates[0];
            let prev = dates[0];
            for (let i = 1; i <= dates.length; i++) {
              const curr = dates[i];
              if (curr) {
                const prevDate = new Date(prev + 'T00:00:00Z');
                const currDate = new Date(curr + 'T00:00:00Z');
                const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays > 1) {
                  const segEnd = new Date(prev + 'T00:00:00Z');
                  segEnd.setUTCDate(segEnd.getUTCDate() + 1);
                  snapshotStaySegments.push({ checkIn: segStart, checkOut: segEnd.toISOString().split('T')[0] });
                  segStart = curr;
                }
                prev = curr;
              } else {
                // Last date
                const segEnd = new Date(prev + 'T00:00:00Z');
                segEnd.setUTCDate(segEnd.getUTCDate() + 1);
                snapshotStaySegments.push({ checkIn: segStart, checkOut: segEnd.toISOString().split('T')[0] });
              }
            }

            // Build guests per date
            const dailyGuestsMap = metadata?.dailyGuestsCount as Record<string, any> | undefined;
            for (const d of dates) {
              if (dailyGuestsMap && dailyGuestsMap[d]) {
                snapshotGuests[d] = { adults: dailyGuestsMap[d].adults || finalGuests, children: dailyGuestsMap[d].children || 0 };
              } else {
                snapshotGuests[d] = { adults: finalGuests, children: 0 };
              }
            }
          }
        } else {
          // Fallback: single segment from checkIn/checkOut
          snapshotStaySegments.push({
            checkIn: finalCheckIn instanceof Date ? finalCheckIn.toISOString().split('T')[0] : String(finalCheckIn).split('T')[0],
            checkOut: finalCheckOut instanceof Date ? finalCheckOut.toISOString().split('T')[0] : String(finalCheckOut).split('T')[0],
          });
          const startKey = finalCheckIn instanceof Date ? finalCheckIn.toISOString().split('T')[0] : String(finalCheckIn).split('T')[0];
          snapshotGuests[startKey] = { adults: finalGuests, children: 0 };
        }

        // Build services snapshot
        if (updateData.servicesSnapshot && Array.isArray(updateData.servicesSnapshot)) {
          // Group services by segment start date
          for (const seg of snapshotStaySegments) {
            snapshotServices[seg.checkIn] = updateData.servicesSnapshot.map((s: any) => `${s.name} ×${s.quantity || 1}`);
          }
        }
      }

      // 10. Save Immutable OrderTransaction
      const nextSrNo = (await tx.orderTransaction.count({ where: { bookingId: booking.id } })) + 1;
      
      await tx.orderTransaction.create({
        data: {
          srNo: nextSrNo,
          transactionTime: new Date(),
          bookingId: booking.id,
          actionType: action,
          actorRole: resolvedRole,
          previousState: booking.status,
          newState: newState,
          paymentType,
          refundTier,
          refundStatus,
          
          previousOrderTotal,
          orderValueDelta,
          newOrderTotal,

          previousTotalPaid,
          advancePaymentDelta,
          balancePaymentDelta,

          refundDueDelta,
          refundPaidDelta,

          newTotalPaid,
          newTotalRefunded,
          newAdvancePaid,
          newRemainingAmount: newAmountToBePaid,
          newPendingRefund,
          newAmountToBePaid,

          snapshotStaySegments: snapshotStaySegments.length > 0 ? snapshotStaySegments : undefined,
          snapshotServices: Object.keys(snapshotServices).length > 0 ? snapshotServices : undefined,
          snapshotGuests: Object.keys(snapshotGuests).length > 0 ? snapshotGuests : undefined,
        }
      });

      // 10. Audit Log for backwards compatibility
      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          actorId: resolvedUserId,
          actorRole: resolvedRole,
          action,
          oldState: booking.status,
          newState: newState,
          metadata: metadata as any || {},
        },
      });

      // 11. Sync Guest ID proofs if provided in edit
      if (metadata && Array.isArray(metadata.guestIdProofs)) {
        await tx.guestIdProof.deleteMany({ where: { bookingId: booking.id } });
        for (const proof of metadata.guestIdProofs) {
          if (proof.url) {
            await tx.guestIdProof.create({
              data: {
                bookingId: booking.id,
                fileUrl: proof.url,
                fileType: proof.type || 'image/jpeg',
                guestName: proof.name || 'Guest'
              }
            });
          }
        }
      }

      return updatedBooking;
    }, {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('PATCH booking error:', error);
    if (error.message.includes('not valid from state') || error.message.includes('Booking not found')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error: ' + error.message }, { status: 500 });
  }
}
