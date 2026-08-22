export function formatBookingSegments(nightlyBreakdown: any, fallbackCheckIn: string | Date, fallbackCheckOut: string | Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  
  if (!nightlyBreakdown || !Array.isArray(nightlyBreakdown) || nightlyBreakdown.length === 0) {
    return `${formatter.format(new Date(fallbackCheckIn))} - ${formatter.format(new Date(fallbackCheckOut))}`;
  }

  const dates = nightlyBreakdown
    .map((n: any) => new Date(`${n.date}T00:00:00`))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) {
    return `${formatter.format(new Date(fallbackCheckIn))} - ${formatter.format(new Date(fallbackCheckOut))}`;
  }

  // With continuous ranges, start and end dates are all we need for formatRange.
  const start = dates[0];
  const end = new Date(dates[dates.length - 1]);
  end.setDate(end.getDate() + 1); // checkout is the day after the last night

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}
