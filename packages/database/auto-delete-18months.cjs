const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function autoDeleteOldOrders() {
  try {
    const eighteenMonthsAgo = new Date();
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

    console.log(`Searching for bookings older than ${eighteenMonthsAgo.toISOString()}`);

    const oldBookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          lt: eighteenMonthsAgo,
        },
      },
      select: { id: true, bookingCode: true }
    });

    if (oldBookings.length === 0) {
      console.log('No bookings older than 18 months found.');
      return;
    }

    console.log(`Found ${oldBookings.length} bookings to delete.`);

    let deletedCount = 0;
    for (const booking of oldBookings) {
      try {
        await prisma.booking.delete({
          where: { id: booking.id }
        });
        console.log(`Deleted booking ${booking.bookingCode} (${booking.id})`);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete booking ${booking.bookingCode}:`, err.message);
      }
    }

    console.log(`Successfully deleted ${deletedCount} out of ${oldBookings.length} old bookings.`);
  } catch (error) {
    console.error('Error during auto-delete process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

autoDeleteOldOrders();
