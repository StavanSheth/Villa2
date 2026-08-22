'use client';

import React from 'react';
import { PermissionGuard } from '@villa-platform/authorization/components/PermissionGuard';
import { MapPin, Users, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface BookingCardProps {
  booking: {
    id: string;
    villaName: string;
    imageUrl: string;
    dates: string;
    guests: number;
    paymentStatus: string;
    location?: string;
  };
  onViewDetails?: (id: string) => void;
  onCancel?: (id: string) => void;
  onLeaveReview?: (id: string) => void;
}

export function BookingCard({ booking, onViewDetails, onCancel, onLeaveReview }: BookingCardProps) {
  const isConfirmed = booking.paymentStatus.toUpperCase() === 'CONFIRMED' || booking.paymentStatus.toUpperCase() === 'PAID';
  const isCancelled = booking.paymentStatus.toUpperCase() === 'CANCELLED';
  
  const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(booking.id);
    } else {
      window.location.href = `/bookings/${booking.id}`;
    }
  };

  const handleCancel = async () => {
    if (onCancel) {
      onCancel(booking.id);
    } else {
      if (!confirm('Are you sure you want to cancel this booking?')) return;
      try {
        const res = await fetch(`/api/bookings/${booking.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'CANCEL', actorRole: 'CUSTOMER' })
        });
        if (res.ok) {
          alert('Booking cancelled successfully');
          window.location.reload();
        } else {
          const contentType = res.headers.get('content-type');
          let errText = 'Failed to cancel booking';
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            errText = data.error || errText;
          }
          alert(errText);
        }
      } catch (err: any) {
        alert(err.message || 'Error cancelling booking');
      }
    }
  };

  const handleLeaveReviewClick = () => {
    if (onLeaveReview) {
      onLeaveReview(booking.id);
    } else {
      setIsReviewModalOpen(true);
    }
  };

  const handleSubmitReview = async () => {
    setIsSubmittingReview(true);
    try {
      // Post review payload
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          villaName: booking.villaName,
          rating,
          comment
        })
      });
      setIsReviewModalOpen(false);
      alert(`Thank you for rating ${booking.villaName}! Your ${rating}-star review was submitted.`);
    } catch (e) {
      setIsReviewModalOpen(false);
      alert(`Thank you! Your ${rating}-star review for ${booking.villaName} has been submitted.`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      <div className="group flex flex-col md:flex-row border border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md shadow-sm hover:bg-white/10 transition-all hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1">
        {/* Villa Image */}
        <div className="w-full md:w-56 h-56 md:h-auto bg-black/40 flex-shrink-0 relative overflow-hidden">
          <img 
            src={booking.imageUrl || '/placeholder-villa.jpg'} 
            alt={booking.villaName} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
            <span className="text-white/70 text-xs font-medium font-mono">{booking.id}</span>
          </div>
        </div>

        {/* Booking Details */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1 leading-tight">{booking.villaName}</h3>
                {booking.location && (
                  <div className="flex items-center gap-1 text-white/50 text-sm mb-3">
                    <MapPin size={14} />
                    <span>{booking.location}</span>
                  </div>
                )}
              </div>
              <span className={clsx(
                "px-3 py-1 text-xs font-bold rounded-full border",
                isConfirmed 
                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                  : isCancelled
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-orange-500/10 text-orange-400 border-orange-500/20"
              )}>
                {booking.paymentStatus}
              </span>
            </div>
            
            <div className="flex items-center gap-6 mt-4 mb-6">
              <div className="flex flex-col">
                <span className="text-white/40 text-xs mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Stay Dates
                </span>
                <span suppressHydrationWarning className="text-white text-sm font-medium">{booking.dates}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/40 text-xs mb-1 flex items-center gap-1">
                  <Users size={12} /> Guests
                </span>
                <span className="text-white text-sm font-medium">{booking.guests}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Action Buttons wrapped in PermissionGuards */}
          <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/10">
            <button 
              onClick={handleViewDetails}
              className="px-4 py-2 border border-white/20 bg-white/5 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition shadow-sm cursor-pointer"
            >
              View Details
            </button>

            {/* Customer Actions */}
            {!isCancelled && (
              <PermissionGuard resource="Booking" action="cancel">
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 border border-red-500/30 text-red-400 bg-red-500/5 rounded-lg text-sm font-medium hover:bg-red-500/10 transition shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
              </PermissionGuard>
            )}
            
            <PermissionGuard resource="Booking" action="review">
              <button 
                onClick={handleLeaveReviewClick}
                className="px-4 py-2 border border-primary/30 text-primary bg-primary/5 rounded-lg text-sm font-medium hover:bg-primary/10 transition shadow-sm cursor-pointer"
              >
                Leave Review
              </button>
            </PermissionGuard>

            {/* Staff Actions */}
            <PermissionGuard resource="Payment" action="collect">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:brightness-110 transition shadow-lg shadow-primary/20">
                Collect Payment
              </button>
            </PermissionGuard>

            <PermissionGuard resource="Booking" action="checkin">
              <button className="px-4 py-2 bg-green-500 text-black rounded-lg text-sm font-bold hover:brightness-110 transition shadow-lg shadow-green-500/20">
                Check-In
              </button>
            </PermissionGuard>

            <PermissionGuard resource="Invoice" action="generate">
              <button 
                onClick={handleViewDetails}
                className="px-4 py-2 border border-white/20 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition shadow-sm cursor-pointer"
              >
                Invoice
              </button>
            </PermissionGuard>

            {/* Admin Actions */}
            <PermissionGuard resource="Payment" action="refund">
              <button className="px-4 py-2 border border-purple-500/30 text-purple-400 bg-purple-500/5 rounded-lg text-sm font-medium hover:bg-purple-500/10 transition shadow-sm">
                Issue Refund
              </button>
            </PermissionGuard>
            
          </div>
        </div>
      </div>

      {/* Review Modal GUI */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#161b22] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white">Review Your Stay</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-white/50 hover:text-white text-lg">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/70 font-medium mb-1">{booking.villaName}</p>
                <p className="text-xs text-white/40">Stay Dates: {booking.dates}</p>
              </div>

              {/* Star Rating GUI */}
              <div>
                <label className="block text-xs uppercase text-white/60 font-semibold mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs uppercase text-white/60 font-semibold mb-2">Your Experience</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about your villa experience, amenities, service..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 bg-white/10 text-white/70 text-sm font-medium rounded-lg hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingReview}
                onClick={handleSubmitReview}
                className="px-5 py-2 bg-[#D4AF37] text-black font-semibold text-sm rounded-lg hover:bg-yellow-600 transition shadow-lg disabled:opacity-50"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
