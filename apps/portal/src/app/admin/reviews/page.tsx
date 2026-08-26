import React from 'react';
import { prisma } from "@villa-platform/database";
import { Star, CheckCircle, Clock, XCircle } from "lucide-react";

export default async function AdminReviewsPage() {
  let reviews = [];
  
  try {
    // Admin sees pending reviews for moderation
    reviews = await prisma.review.findMany({
      where: { status: "PENDING" },
      include: { user: true, villa: true },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.warn("Reviews page: DB offline, falling back to mock data");
    reviews = [
      {
        id: "mock_1",
        rating: 5,
        comment: "Absolutely stunning villa. The service was impeccable.",
        status: "PENDING",
        createdAt: new Date(),
        villa: { name: "Villa Azure" },
        user: { firstName: "Jane", lastName: "Doe" }
      },
      {
        id: "mock_2",
        rating: 3,
        comment: "It was okay, but the AC was loud.",
        status: "PENDING",
        createdAt: new Date(),
        villa: { name: "Villa Blanc" },
        user: { firstName: "John", lastName: "Smith" }
      }
    ];
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-serif text-primary">Review Moderation</h1>
        <p className="text-sm text-white/50 mt-1">
          Approve or reject guest reviews before they appear publicly.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl text-center py-16">
          <Star className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-white mb-2">No Reviews Found</h3>
          <p className="text-sm text-white/50">
            All caught up! No pending reviews to moderate.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-white text-lg">
                    {review.villa.name}
                  </h3>
                  <p className="text-sm text-white/50 mt-1">
                    By {review.user.firstName} {review.user.lastName} on {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < review.rating ? "fill-current" : "opacity-30"}`} />
                  ))}
                </div>
              </div>
              
              <p className="text-white/80 text-sm leading-relaxed mb-6 italic border-l-2 border-primary/50 pl-4">
                "{review.comment}"
              </p>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-medium text-white/60">
                    PENDING APPROVAL
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <button className="text-xs px-4 py-2 border border-red-500/30 text-red-400 rounded hover:bg-red-500/10 transition-colors">
                    Reject
                  </button>
                  <button className="text-xs px-4 py-2 bg-primary text-black rounded font-medium hover:bg-primary/90 transition-colors">
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
