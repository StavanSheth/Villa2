import { Hono } from 'hono';
import { prisma } from '@villa-platform/database';

const reviews = new Hono();

reviews.post('/', async (c) => {
  try {
    const { villaId, rating, comment, userId } = await c.req.json();
    
    if (!villaId || !rating || !comment || !userId) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Ponytail: Simple transaction to enforce business logic natively at the DB level
    const review = await prisma.$transaction(async (tx) => {
      // 1. Business Rule: Must have a completed or checked out booking
      const validBooking = await tx.booking.findFirst({
        where: {
          villaId,
          userId,
          status: { in: ['COMPLETED', 'CHECKED_OUT'] }
        }
      });

      if (!validBooking) {
        throw new Error('You can only review a villa after completing a stay.');
      }

      // 2. Business Rule: Cannot review twice for the same booking
      const existingReview = await tx.review.findFirst({
        where: { bookingId: validBooking.id }
      });

      if (existingReview) {
        throw new Error('You have already submitted a review for this stay.');
      }

      // 3. Create review
      const newReview = await tx.review.create({
        data: {
          userId,
          villaId,
          bookingId: validBooking.id,
          rating,
          comment,
          status: 'PENDING' // Await moderation
        }
      });

      return newReview;
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });

    return c.json({ success: true, review });
  } catch (error: any) {
    console.error('Review submission failed:', error);
    // Return 403 Forbidden for business rule violations
    return c.json({ error: error.message }, 403);
  }
});

export default reviews;
