const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const activeBookings = await p.booking.findMany({ 
    where: { status: { in: ['CONFIRMED', 'ADVANCE_PAID', 'AWAITING_PAYMENT'] } } 
  }); 
  const totalRevenue = activeBookings.reduce((sum, b) => sum + Number(b.totalPaid || 0), 0); 
  const totalBookings = activeBookings.length; 
  const totalGuests = activeBookings.reduce((sum, b) => sum + b.totalGuests, 0); 
  const allBookings = await p.booking.findMany({}); 
  const totalRefunds = allBookings.reduce((sum, b) => sum + Number(b.totalRefunded || 0), 0); 
  const totalRefundsToInitiate = allBookings.reduce((sum, b) => sum + Number(b.pendingRefund || 0), 0); 

  console.log({ 
    totalRevenue, 
    totalBookings, 
    totalGuests, 
    totalRefunds, 
    totalRefundsToInitiate,
    allBookingsCount: allBookings.length 
  }); 
  
  await p.$disconnect();
}
main();
