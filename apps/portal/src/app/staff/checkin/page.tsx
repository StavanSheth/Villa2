import React from 'react';
import CheckInFlow from '../../../features/checkin/CheckInFlow';

export default function CheckInPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif text-white">Guest Check-In & Verification</h1>
        <p className="text-sm text-white/50 mt-1">Process arrival payments, UTR verification, and keys dispatch</p>
      </div>

      <div className="bg-black/60 border border-white/10 p-6 rounded-xl">
        <CheckInFlow bookingId="MVN-849201" />
      </div>
    </div>
  );
}
