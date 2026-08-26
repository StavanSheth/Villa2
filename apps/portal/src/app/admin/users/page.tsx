import React from 'react';
import { UserPlus, Shield, Key, UserCheck, UserX, Search } from 'lucide-react';

export default function UsersPage() {
  const users = [
    { id: "u-01", name: "Stavan Patel", email: "stavan@mavon.online", role: "SUPER_ADMIN", status: "ACTIVE" },
    { id: "u-02", name: "Rohan Malhotra", email: "rohan@mavon.online", role: "ADMIN", status: "ACTIVE" },
    { id: "u-03", name: "Karan Verma", email: "karan@mavon.online", role: "STAFF", status: "ACTIVE" },
    { id: "u-04", name: "Priya Sharma", email: "priya@example.com", role: "CUSTOMER", status: "ACTIVE" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Users & RBAC Management</h1>
          <p className="text-sm text-white/50 mt-1">Manage platform users, roles, and access credentials</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-[#b8952b] transition">
          <UserPlus className="w-4 h-4" /> Provision Staff / Admin
        </button>
      </div>

      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="bg-white/5 text-xs text-white/40 uppercase border-b border-white/10">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4">
                  <p className="font-medium text-white">{u.name}</p>
                  <p className="text-xs text-white/40">{u.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white">
                    <Shield className="w-3 h-3 text-primary" />
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="text-xs px-3 py-1.5 bg-white/10 rounded hover:bg-white/20 transition">Reset Password</button>
                  <button className="text-xs px-3 py-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition">Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
