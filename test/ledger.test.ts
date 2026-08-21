import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { processLedgerTransaction } from '../queries/ledger';

const prisma = new PrismaClient();

describe('Ledger Engine 30-Scenario Matrix', () => {
  let bookingId: string;

  beforeAll(async () => {
    // Basic setup for a test villa/customer
    const testVilla = await prisma.villa.findFirst() || await prisma.villa.create({
      data: { name: 'Test Villa', type: 'FARMHOUSE', basePrice: 10000, maxGuests: 10, bedrooms: 3, description: 'Test', address: 'Test', location: { create: { city: 'TestCity', state: 'TestState', country: 'TestCountry' } } }
    });
    
    const customer = await prisma.customer.findFirst() || await prisma.customer.create({
      data: { name: 'Test Customer', email: 'test@example.com', phone: '1234567890' }
    });

    const b = await prisma.booking.create({
      data: {
        villaId: testVilla.id,
        customerId: customer.id,
        bookingCode: 'TEST-LEDGER-001',
        status: 'PENDING',
        currentTotal: 0,
        totalAdvancePaid: 0,
        totalBalancePaid: 0,
        totalPaid: 0,
        totalRefunded: 0,
        pendingRefund: 0,
        amountToBePaid: 0
      }
    });
    bookingId = b.id;
  });

  afterAll(async () => {
    await prisma.orderTransaction.deleteMany({ where: { bookingId } });
    await prisma.booking.delete({ where: { id: bookingId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset the booking state to 0 for each independent test unless specified
    await prisma.orderTransaction.deleteMany({ where: { bookingId } });
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        currentTotal: 0,
        totalAdvancePaid: 0,
        totalBalancePaid: 0,
        totalPaid: 0,
        totalRefunded: 0,
        pendingRefund: 0,
        amountToBePaid: 0
      }
    });
  });

  // Helper to fetch current state
  const getState = async () => prisma.booking.findUnique({ where: { id: bookingId } });

  it('Scenario 1: New order with no payment', async () => {
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'CREATE', actorRole: 'SYSTEM', orderValueDelta: 10000
    });
    const state = await getState();
    expect(Number(state!.currentTotal)).toBe(10000);
    expect(Number(state!.amountToBePaid)).toBe(10000);
    expect(Number(state!.pendingRefund)).toBe(0);
  });

  it('Scenario 2: New order with advance payment', async () => {
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'CREATE', actorRole: 'SYSTEM', orderValueDelta: 16520, advancePaymentDelta: 5452
    });
    const state = await getState();
    expect(Number(state!.currentTotal)).toBe(16520);
    expect(Number(state!.totalAdvancePaid)).toBe(5452);
    expect(Number(state!.totalPaid)).toBe(5452);
    expect(Number(state!.amountToBePaid)).toBe(11068);
    expect(Number(state!.pendingRefund)).toBe(0);
  });

  it('Scenario 5 & Screenshot Case 1 (Transactions 1-5)', async () => {
    // TX 1
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'CREATE', actorRole: 'SYSTEM', orderValueDelta: 16520, advancePaymentDelta: 5452
    });
    
    // TX 2
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'ADD_SERVICES', actorRole: 'SYSTEM', orderValueDelta: 47200, advancePaymentDelta: 15576
    });
    let state = await getState();
    expect(Number(state!.currentTotal)).toBe(63720);
    expect(Number(state!.totalPaid)).toBe(21028);
    expect(Number(state!.amountToBePaid)).toBe(42692);
    expect(Number(state!.pendingRefund)).toBe(0);

    // TX 3 - Reversal
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'REVERSE', actorRole: 'SYSTEM', orderValueDelta: -47200
    });
    state = await getState();
    expect(Number(state!.currentTotal)).toBe(16520);
    expect(Number(state!.totalPaid)).toBe(21028);
    expect(Number(state!.amountToBePaid)).toBe(0);
    expect(Number(state!.pendingRefund)).toBe(4508);

    // TX 4
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'ADD_GUESTS', actorRole: 'SYSTEM', orderValueDelta: 70800, advancePaymentDelta: 23364
    });
    state = await getState();
    expect(Number(state!.currentTotal)).toBe(87320);
    expect(Number(state!.totalPaid)).toBe(44392);
    expect(Number(state!.amountToBePaid)).toBe(42928);
    expect(Number(state!.pendingRefund)).toBe(0);

    // TX 5 - Reversal
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'REVERSE_GUESTS', actorRole: 'SYSTEM', orderValueDelta: -70800
    });
    state = await getState();
    expect(Number(state!.currentTotal)).toBe(16520);
    expect(Number(state!.totalPaid)).toBe(44392);
    expect(Number(state!.amountToBePaid)).toBe(0);
    expect(Number(state!.pendingRefund)).toBe(27872); // Corrected expected behavior
  });

  it('Scenario 6 & Screenshot Case 2 (Negative transaction not causing refund)', async () => {
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'CREATE', actorRole: 'SYSTEM', orderValueDelta: 15340, advancePaymentDelta: 5062
    });
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'REVERSE', actorRole: 'SYSTEM', orderValueDelta: -10278
    });
    const state = await getState();
    expect(Number(state!.currentTotal)).toBe(5062);
    expect(Number(state!.totalPaid)).toBe(5062);
    expect(Number(state!.pendingRefund)).toBe(0);
    expect(Number(state!.amountToBePaid)).toBe(0);
  });

  it('Scenario 12 & 13: Partial and Full Refund', async () => {
    // Setup state
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'CREATE', actorRole: 'SYSTEM', orderValueDelta: 16520, advancePaymentDelta: 21028
    });
    let state = await getState();
    expect(Number(state!.pendingRefund)).toBe(4508);

    // Partial Refund Paid
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'REFUND_PAID', actorRole: 'SYSTEM', refundPaidDelta: 2000
    });
    state = await getState();
    expect(Number(state!.totalRefunded)).toBe(2000);
    expect(Number(state!.pendingRefund)).toBe(2508);

    // Remaining Refund Paid
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'REFUND_PAID', actorRole: 'SYSTEM', refundPaidDelta: 2508
    });
    state = await getState();
    expect(Number(state!.totalRefunded)).toBe(4508);
    expect(Number(state!.pendingRefund)).toBe(0);
  });

  it('Scenario 15: Refund Reversal', async () => {
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'CREATE', actorRole: 'SYSTEM', orderValueDelta: 10000, advancePaymentDelta: 15000
    });
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'REFUND_PAID', actorRole: 'SYSTEM', refundPaidDelta: 3000
    });
    let state = await getState();
    expect(Number(state!.pendingRefund)).toBe(2000);
    expect(Number(state!.totalRefunded)).toBe(3000);

    // Reversal of refund
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'REFUND_REVERSAL', actorRole: 'SYSTEM', refundPaidDelta: -3000
    });
    state = await getState();
    expect(Number(state!.pendingRefund)).toBe(5000);
    expect(Number(state!.totalRefunded)).toBe(0);
  });

  it('Scenario 16: Payment Reversal', async () => {
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'CREATE', actorRole: 'SYSTEM', orderValueDelta: 20000, advancePaymentDelta: 15000, balancePaymentDelta: 5000
    });
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'PAYMENT_REVERSAL', actorRole: 'SYSTEM', balancePaymentDelta: -5000
    });
    const state = await getState();
    expect(Number(state!.totalPaid)).toBe(15000);
    expect(Number(state!.amountToBePaid)).toBe(5000);
    expect(Number(state!.pendingRefund)).toBe(0);
  });

  it('Scenario 17: Order increase while refund is pending', async () => {
    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'CREATE', actorRole: 'SYSTEM', orderValueDelta: 10000, advancePaymentDelta: 15000
    });
    let state = await getState();
    expect(Number(state!.pendingRefund)).toBe(5000);

    await processLedgerTransaction(prisma as any, bookingId, {
      actionType: 'ADD_ITEM', actorRole: 'SYSTEM', orderValueDelta: 10000
    });
    state = await getState();
    expect(Number(state!.currentTotal)).toBe(20000);
    expect(Number(state!.amountToBePaid)).toBe(5000);
    expect(Number(state!.pendingRefund)).toBe(0);
  });

  it('Scenario 30: Ledger Reconstruction Test', async () => {
    // Generate complex history
    await processLedgerTransaction(prisma as any, bookingId, { actionType: 'CREATE', actorRole: 'SYSTEM', orderValueDelta: 10000, advancePaymentDelta: 5000 });
    await processLedgerTransaction(prisma as any, bookingId, { actionType: 'ADD', actorRole: 'SYSTEM', orderValueDelta: 5000, advancePaymentDelta: 5000 });
    await processLedgerTransaction(prisma as any, bookingId, { actionType: 'REDUCE', actorRole: 'SYSTEM', orderValueDelta: -7000 });
    await processLedgerTransaction(prisma as any, bookingId, { actionType: 'REFUND', actorRole: 'SYSTEM', refundPaidDelta: 1000 });
    await processLedgerTransaction(prisma as any, bookingId, { actionType: 'BALANCE', actorRole: 'SYSTEM', balancePaymentDelta: 2000 });
    
    const trueState = await getState();

    // Wipe cached state
    await prisma.booking.update({
      where: { id: bookingId },
      data: { currentTotal: 0, totalAdvancePaid: 0, totalBalancePaid: 0, totalPaid: 0, totalRefunded: 0, pendingRefund: 0, amountToBePaid: 0 }
    });

    // Replay calculation from transactions
    const txs = await prisma.orderTransaction.findMany({ where: { bookingId }, orderBy: { srNo: 'asc' } });
    
    let simOrder = 0, simAdv = 0, simBal = 0, simRef = 0;
    for (const tx of txs) {
      simOrder += Number(tx.orderValueDelta);
      simAdv += Number(tx.advancePaymentDelta);
      simBal += Number(tx.balancePaymentDelta);
      simRef += Number(tx.refundPaidDelta);
    }
    const simNet = (simAdv + simBal) - simRef;
    const simAmt = Math.max(0, simOrder - simNet);
    const simPend = Math.max(0, simNet - simOrder);

    // Verify exactly matches DB derived true state
    expect(simOrder).toBe(Number(trueState!.currentTotal));
    expect(simAdv).toBe(Number(trueState!.totalAdvancePaid));
    expect(simBal).toBe(Number(trueState!.totalBalancePaid));
    expect(simRef).toBe(Number(trueState!.totalRefunded));
    expect(simAmt).toBe(Number(trueState!.amountToBePaid));
    expect(simPend).toBe(Number(trueState!.pendingRefund));
  });

});
