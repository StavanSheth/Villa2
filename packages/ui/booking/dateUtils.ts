export function formatBookingSegments(nightlyBreakdown: any, fallbackCheckIn: string | Date, fallbackCheckOut: string | Date): string {
  if (!nightlyBreakdown || !Array.isArray(nightlyBreakdown) || nightlyBreakdown.length === 0) {
    return `${new Date(fallbackCheckIn).toLocaleDateString('en-US')} - ${new Date(fallbackCheckOut).toLocaleDateString('en-US')}`;
  }

  const dates = nightlyBreakdown
    .map((n: any) => new Date(`${n.date}T00:00:00`))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) {
    return `${new Date(fallbackCheckIn).toLocaleDateString('en-US')} - ${new Date(fallbackCheckOut).toLocaleDateString('en-US')}`;
  }

  const segments: { start: Date; end: Date }[] = [];
  let currentStart = dates[0];
  let currentEnd = new Date(currentStart);

  for (let i = 1; i < dates.length; i++) {
    const prevDate = dates[i - 1];
    const currDate = dates[i];
    
    // Check if consecutive (difference is exactly 1 day)
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentEnd = currDate;
    } else {
      // End current segment
      const checkoutDate = new Date(currentEnd);
      checkoutDate.setDate(checkoutDate.getDate() + 1);
      segments.push({ start: currentStart, end: checkoutDate });
      
      // Start new segment
      currentStart = currDate;
      currentEnd = currDate;
    }
  }

  // Push final segment
  const finalCheckoutDate = new Date(currentEnd);
  finalCheckoutDate.setDate(finalCheckoutDate.getDate() + 1);
  segments.push({ start: currentStart, end: finalCheckoutDate });

  // Format segments
  return segments.map(seg => 
    `${seg.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${seg.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  ).join(', ');
}
