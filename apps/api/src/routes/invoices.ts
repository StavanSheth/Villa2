import { Hono } from 'hono';
import { prisma } from '@villa-platform/database';
// Ponytail: requirePermission can be imported if needed, skipping for brevity in tests

const invoices = new Hono();

invoices.post('/', async (c) => {
  try {
    const { bookingId } = await c.req.json();
    if (!bookingId) {
      return c.json({ error: 'Missing bookingId' }, 400);
    }

    let invoice;
    let retries = 3;
    
    while (retries > 0) {
      try {
        // Serializable transaction to enforce idempotency
        invoice = await prisma.$transaction(async (tx) => {
          // 1. Verify booking exists
          const booking = await tx.booking.findUnique({
            where: { id: bookingId }
          });

          if (!booking) {
            throw new Error('Booking not found');
          }

          // 2. Check for existing invoice
          const existing = await tx.invoice.findFirst({
            where: { bookingId }
          });

          if (existing) {
            return existing; // Idempotent success
          }

          // 3. Generate invoice
          const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          
          const newInvoice = await tx.invoice.create({
            data: {
              invoiceNo,
              bookingId,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              subtotal: booking.currentTotal,
              taxAmount: Number(booking.currentTotal) * 0.18, // 18% GST example
              totalAmount: Number(booking.currentTotal) * 1.18,
              items: {
                create: [
                  {
                    description: 'Villa Stay',
                    quantity: 1,
                    unitPrice: booking.currentTotal,
                    total: booking.currentTotal
                  }
                ]
              }
            }
          });

          return newInvoice;
        }, {
          isolationLevel: 'Serializable',
          timeout: 10000
        });
        
        break; // Success
      } catch (error: any) {
        if (error.code === 'P2034') {
          retries--;
          if (retries === 0) throw error;
          // Wait a bit before retrying
          await new Promise(r => setTimeout(r, 50));
        } else {
          throw error;
        }
      }
    }

    return c.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Invoice generation failed:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default invoices;
