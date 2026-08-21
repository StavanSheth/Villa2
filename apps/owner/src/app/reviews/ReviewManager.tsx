'use client';
import React, { useState } from 'react';
import { Star, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ReviewManager({ initialReviews }: { initialReviews: any[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const router = useRouter();

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update review status');
      
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      router.refresh();
    } catch (err) {
      alert('Error updating review');
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="liquid-glass rounded-2xl p-20 text-center mt-8 border border-white/10">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <Star className="w-8 h-8 text-gold opacity-50" />
        </div>
        <h2 className="text-xl font-medium text-[var(--text-dark)] mb-2">No Reviews Yet</h2>
        <p className="text-[var(--text-sec-dark)] max-w-md mx-auto">
          Reviews will appear here once guests complete their stays and leave feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8">
      {reviews.map((review) => (
        <div key={review.id} className="liquid-glass rounded-2xl p-6 flex flex-col md:flex-row gap-6 border border-white/5">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">{review.user?.firstName} {review.user?.lastName}</h3>
                <p className="text-sm text-white/50">{review.villa?.name} • <span suppressHydrationWarning>{new Date(review.createdAt).toLocaleDateString()}</span></p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-gold text-gold' : 'text-white/20'}`} />
                ))}
              </div>
            </div>
            <p className="text-white/80 italic">"{review.comment}"</p>
          </div>
          
          <div className="flex items-center md:flex-col justify-end md:justify-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
            {review.status === 'PENDING' ? (
              <>
                <button 
                  onClick={() => handleStatusChange(review.id, 'APPROVED')}
                  className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 hover:bg-green-500/20 px-4 py-2 rounded-lg transition cursor-pointer w-full justify-center"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button 
                  onClick={() => handleStatusChange(review.id, 'REJECTED')}
                  className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition cursor-pointer w-full justify-center"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            ) : (
              <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium w-full justify-center ${
                review.status === 'APPROVED' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
              }`}>
                {review.status === 'APPROVED' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {review.status}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
