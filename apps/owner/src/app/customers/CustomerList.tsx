'use client';
import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';

export function CustomerList({ users }: { users: any[] }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="liquid-glass rounded-2xl overflow-hidden mt-8">
      <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-2">
        <Users className="w-5 h-5 text-gold" />
        <h2 className="text-lg font-medium text-[var(--text-dark)]">Guest List ({users.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider w-10"></th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Name</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Email</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Total Bookings</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-sec-dark)]">No customers found.</td>
              </tr>
            )}
            {users.map((u) => (
              <React.Fragment key={u.id}>
                <tr 
                  onClick={() => toggleRow(u.id)}
                  className="hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="p-4 text-[var(--text-sec-dark)] group-hover:text-gold transition-colors">
                    {expandedRow === u.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </td>
                  <td className="p-4 font-medium text-[var(--text-dark)]">{u.firstName} {u.lastName}</td>
                  <td className="p-4 text-[var(--text-sec-dark)]">{u.email}</td>
                  <td className="p-4 text-[var(--text-dark)] font-bold">{u.bookings.length}</td>
                  <td suppressHydrationWarning className="p-4 text-sm text-[var(--text-sec-dark)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
                
                {/* Expanded Details Row */}
                {expandedRow === u.id && (
                  <tr className="bg-white/[0.02]">
                    <td colSpan={5} className="p-0">
                      <div className="p-6 border-l-2 border-gold ml-10 my-4 bg-black/20 rounded-r-lg">
                        <h4 className="text-sm font-semibold text-gold mb-4 uppercase tracking-wider">Booking History</h4>
                        {u.bookings.length === 0 ? (
                          <p className="text-sm text-white/50">No booking details available.</p>
                        ) : (
                          <div className="space-y-4">
                            {u.bookings.map((booking: any) => (
                              <div key={booking.id} className="flex flex-col border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium text-white">{booking.villa?.name || 'Unknown Property'}</div>
                                    <div className="text-sm text-white/50 mt-1">
                                      {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-gold">₹{booking.currentTotal.toLocaleString()}</div>
                                    <div className="text-xs mt-1">
                                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                                        booking.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
                                        booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400' :
                                        booking.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                                        'bg-red-500/10 text-red-400'
                                      }`}>
                                        {booking.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {booking.reviews && booking.reviews.length > 0 && (
                                  <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-1 mb-1">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <svg key={i} className={`w-3 h-3 ${i < booking.reviews[0].rating ? 'text-gold' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                    </div>
                                    <p className="text-sm text-white/70 italic">"{booking.reviews[0].comment}"</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
