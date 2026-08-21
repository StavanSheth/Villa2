import React from 'react';
import { FileText, Shield, Clock, Terminal } from 'lucide-react';

export default function AuditLogsPage() {
  const logs = [
    { id: "log-1", time: "19:24:02", user: "Karan Verma (Staff)", action: "CASH_COLLECTION", resource: "Booking:MVN-849201", ip: "192.168.1.12" },
    { id: "log-2", time: "18:45:10", user: "Stavan Patel (Super Admin)", action: "ROLE_UPDATE", resource: "User:u-02", ip: "192.168.1.45" },
    { id: "log-3", time: "17:30:00", user: "System Worker", action: "ABANDONED_BOOKING_CANCEL", resource: "Booking:MVN-102938", ip: "Edge Worker" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif text-white">System Audit Trail</h1>
        <p className="text-sm text-white/50 mt-1">Immutable security and operations log of all platform actions</p>
      </div>

      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden font-mono text-xs">
        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between text-white/40">
          <span>TIMESTAMP • ACTOR • ACTION • RESOURCE</span>
          <Terminal className="w-4 h-4" />
        </div>
        <div className="divide-y divide-white/5 p-2">
          {logs.map((l) => (
            <div key={l.id} className="p-3 hover:bg-white/5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-x-3 text-white/80">
                <span className="text-white/40">{l.time}</span>
                <span className="text-[#D4AF37] font-semibold">{l.user}</span>
                <span className="text-green-400 font-bold">{l.action}</span>
                <span className="text-white">{l.resource}</span>
              </div>
              <span className="text-white/30 text-[10px]">{l.ip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
