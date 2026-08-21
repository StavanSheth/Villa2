import React from 'react';
import { prisma } from '@villa-platform/database';

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const booking = await prisma.booking.findUnique({
    where: { bookingCode: id },
    include: {
      user: true,
      villa: true,
      services: true,
      promoCode: true
    }
  });

  if (!booking) {
    return <div>Invoice not found.</div>;
  }

  const isPaid = Number(booking.totalPaid) >= Number(booking.currentTotal);
  const invoiceDate = new Date(booking.createdAt).toLocaleDateString();

  return (
    <div className="invoice-container bg-white text-black min-h-screen p-10 font-sans" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Auto-print script */}
      <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
      
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <p className="text-gray-500">Invoice #: INV-{booking.bookingCode}</p>
          <p className="text-gray-500">Date: {invoiceDate}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-serif font-bold text-[#D4AF37]">Mavon Villas</h2>
          <p className="text-gray-500 mt-1">123 Luxury Lane, Lonavala</p>
          <p className="text-gray-500">Maharashtra, 410401</p>
          <p className="text-gray-500">contact@mavon.online</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="flex justify-between mb-10">
        <div>
          <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Billed To:</p>
          <p className="font-bold text-gray-900">{booking.user.firstName} {booking.user.lastName}</p>
          <p className="text-gray-600">{booking.user.email}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Property:</p>
          <p className="font-bold text-gray-900">{booking.villa.name}</p>
          <p className="text-gray-600">{new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Line Items */}
      <table className="w-full text-left mb-8">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 text-sm">
            <th className="pb-3 font-medium">Description</th>
            <th className="pb-3 font-medium text-right">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-4 text-gray-800">
              Accommodation ({booking.totalGuests} Guests)
            </td>
            <td className="py-4 text-right text-gray-800 font-medium">
              ₹{(Number(booking.currentTotal) - Number(booking.gstAmount) - Number(booking.cleaningFee) + Number(booking.discountAmount)).toLocaleString()}
            </td>
          </tr>
          
          <tr className="border-b border-gray-100">
            <td className="py-4 text-gray-800">Cleaning Fee</td>
            <td className="py-4 text-right text-gray-800 font-medium">₹{Number(booking.cleaningFee).toLocaleString()}</td>
          </tr>
          
          {booking.services.map(svc => (
            <tr key={svc.id} className="border-b border-gray-100">
              <td className="py-4 text-gray-800">Add-on: {svc.name} (Qty: {svc.quantity})</td>
              <td className="py-4 text-right text-gray-800 font-medium">₹{Number(svc.totalPrice).toLocaleString()}</td>
            </tr>
          ))}

          {Number(booking.discountAmount) > 0 && (
            <tr className="border-b border-gray-100">
              <td className="py-4 text-gray-800">Discount {booking.promoCode ? `(${booking.promoCode.code})` : ''}</td>
              <td className="py-4 text-right text-green-600 font-medium">-₹{Number(booking.discountAmount).toLocaleString()}</td>
            </tr>
          )}

          <tr className="border-b border-gray-200">
            <td className="py-4 text-gray-800">GST (18%)</td>
            <td className="py-4 text-right text-gray-800 font-medium">₹{Number(booking.gstAmount).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-1/2">
          <div className="flex justify-between py-2">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-gray-900">₹{Number(booking.currentTotal).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-500">Amount Paid</span>
            <span className="text-gray-500">₹{Number(booking.totalPaid).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-4 text-xl">
            <span className="font-bold text-gray-900">Balance Due</span>
            <span className="font-bold text-[#D4AF37]">₹{(Number(booking.currentTotal) - Number(booking.totalPaid)).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="mt-16 text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
        <p className="font-bold text-gray-700 mb-2">
          {isPaid ? 'Thank you for your payment!' : 'Payment is due 48 hours prior to check-in.'}
        </p>
        <p>If you have any questions concerning this invoice, please contact contact@mavon.online</p>
      </div>
      
      {/* Print styles to hide UI during actual printing if needed */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-container, .invoice-container * {
            visibility: visible;
          }
          .invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 20px !important;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
        }
      `}} />
    </div>
  );
}
