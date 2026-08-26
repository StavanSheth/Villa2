import React from 'react';
import { UserPlus, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function AdminStaffPage() {
  const staffList = [
    { id: "st-1", name: "Ramesh Kumar", role: "VILLA_MANAGER", villaAssigned: "Seven C Villa", phone: "+91 98765 43210" },
    { id: "st-2", name: "Sunita Singh", role: "HOUSEKEEPING_LEAD", villaAssigned: "Solarium Bay Estate", phone: "+91 98765 12345" },
    { id: "st-3", name: "Deepak Patel", role: "CONCIERGE", villaAssigned: "All Villas", phone: "+91 98123 45678" }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Staff Management</h1>
          <p className="text-sm text-white/50 mt-1">Assign roles, villa responsibilities, and operational access</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-[#b8952b] transition">
          <UserPlus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {staffList.map((s) => (
          <div key={s.id} className="bg-black/60 border border-white/10 p-5 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-white">{s.name}</h3>
                <p className="text-xs text-primary mt-0.5">{s.role}</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-green-400" />
            </div>
            <div className="pt-2 border-t border-white/10 text-xs text-white/60 space-y-1">
              <p>Assigned: <span className="text-white">{s.villaAssigned}</span></p>
              <p>Phone: <span className="text-white">{s.phone}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
