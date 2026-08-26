import React from 'react';
import { Sparkles, CheckCircle, Clock } from 'lucide-react';

export default function HousekeepingPage() {
  const tasks = [
    { villa: "Chunawala's Seven C Villa", status: "CLEANED", lastInspected: "13:00 today", inspector: "Sunita" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif text-white">Housekeeping Operations</h1>
        <p className="text-sm text-white/50 mt-1">Villa cleaning, inspection status, and room readiness</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tasks.map((t) => (
          <div key={t.villa} className="bg-black/60 border border-white/10 p-5 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">{t.villa}</h3>
              <span className={`text-[11px] font-bold px-2 py-1 rounded ${
                t.status === 'CLEANED' ? 'bg-green-500/20 text-green-400' :
                t.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {t.status}
              </span>
            </div>
            <p className="text-xs text-white/60">Inspector: {t.inspector}</p>
            <button className="w-full mt-2 py-2 bg-white/10 text-white rounded text-xs font-semibold hover:bg-white/20 transition">
              Update Status
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
