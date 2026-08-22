export const GST_RATE = 0.18;

export interface SegmentState {
  checkIn: string;      // ISO date string e.g. '2026-09-28'
  checkOut: string;
  accommodation: number;
  services: { name: string; qty: number; unitPrice: number }[];
  guests: { date: string; adults: number; children: number }[];
  status: 'ACTIVE' | 'CANCELLED';
}

export interface FinancialState {
  segments: SegmentState[];
  cleaningFee: number;
  discount: number;
  totalPaid: number;        
  advancePaid: number;      
  balancePaid: number;      
  totalRefunded: number;    
  pendingRefund: number;    
  status: string;
}

export function calcSegmentBase(seg: SegmentState): number {
  const svcTotal = seg.services.reduce((sum, s) => sum + s.unitPrice * s.qty, 0);
  return seg.accommodation + svcTotal;
}

export function calcOrderTotal(state: FinancialState): number {
  const activeSegments = state.segments.filter(s => s.status === 'ACTIVE');
  if (activeSegments.length === 0) return 0;
  const activeBase = activeSegments.reduce((sum, s) => sum + calcSegmentBase(s), 0);
  const totalBase = activeBase + state.cleaningFee - state.discount;
  const gst = Math.round(totalBase * GST_RATE);
  return totalBase + gst;
}

export function calcNetPaid(state: FinancialState): number {
  return state.totalPaid - state.totalRefunded;
}

export function calcRemainingAmount(state: FinancialState): number {
  return calcOrderTotal(state) - state.advancePaid;
}

export function calcAmountToBePaid(state: FinancialState): number {
  const netPaid = calcNetPaid(state);
  return Math.max(0, calcOrderTotal(state) - netPaid);
}

export function calcCustomerCredit(state: FinancialState): number {
  const netPaid = calcNetPaid(state);
  const orderTotal = calcOrderTotal(state);
  return Math.max(0, netPaid - orderTotal);
}

export function buildSnapshotStaySegments(state: FinancialState): any[] {
  return state.segments
    .filter(s => s.status === 'ACTIVE')
    .map(s => ({ checkIn: s.checkIn, checkOut: s.checkOut }));
}

export function buildSnapshotGuests(state: FinancialState): Record<string, { adults: number; children: number }> {
  const result: Record<string, { adults: number; children: number }> = {};
  for (const seg of state.segments.filter(s => s.status === 'ACTIVE')) {
    for (const g of seg.guests) {
      result[g.date] = { adults: g.adults, children: g.children };
    }
  }
  return result;
}

export function buildSnapshotServices(state: FinancialState): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const seg of state.segments.filter(s => s.status === 'ACTIVE')) {
    for (const svc of seg.services) {
      const date = seg.guests[0]?.date || seg.checkIn;
      if (!result[date]) result[date] = [];
      result[date].push(`${svc.name} x${svc.qty}`);
    }
  }
  return result;
}
