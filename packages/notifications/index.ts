import { Resend } from 'resend';
import { render } from '@react-email/components';
import { BookingConfirmationEmail } from './templates/booking-confirmation';
import { ReviewApprovedEmail } from './templates/review-approved';
import React from 'react';

const RESEND_KEY = process.env.RESEND_API_KEY;
if (!RESEND_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('RESEND_API_KEY environment variable is required');
}
const resend = new Resend(RESEND_KEY || 're_dev_placeholder');

export const notifications = {
  sendBookingConfirmation: async (data: {
    to: string;
    customerName: string;
    bookingCode: string;
    villaName: string;
    checkInDate: string;
    checkOutDate: string;
    totalGuests: number;
    totalAmount: number;
    paidAmount: number;
    dashboardUrl: string;
  }) => {
    try {
      const html = await render(React.createElement(BookingConfirmationEmail, data));
      
      const { data: response, error } = await resend.emails.send({
        from: 'Mavon <bookings@mavon.online>',
        to: [data.to],
        subject: `Booking Confirmed: ${data.villaName} - ${data.bookingCode}`,
        html,
      });

      if (error) {
        console.error('Failed to send booking confirmation email:', error);
        return { success: false, error };
      }

      return { success: true, data: response };
    } catch (error) {
      console.error('Exception sending booking confirmation email:', error);
      return { success: false, error };
    }
  },

  sendReviewApproved: async (data: {
    to: string;
    customerName: string;
    villaName: string;
    reviewLink: string;
  }) => {
    try {
      const html = await render(React.createElement(ReviewApprovedEmail, data));
      
      const { data: response, error } = await resend.emails.send({
        from: 'Mavon <reviews@mavon.online>',
        to: [data.to],
        subject: `Your review for ${data.villaName} is published!`,
        html,
      });

      if (error) {
        console.error('Failed to send review approved email:', error);
        return { success: false, error };
      }

      return { success: true, data: response };
    } catch (error) {
      console.error('Exception sending review approved email:', error);
      return { success: false, error };
    }
  },
};

