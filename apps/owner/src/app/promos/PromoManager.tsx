'use client';
import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PromoManager({ initialPromos }: { initialPromos: any[] }) {
  const [promos, setPromos] = useState(initialPromos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'FIXED',
    value: '',
    minBookingAmt: '',
    maxDiscount: '',
    minNights: '',
    maxNights: '',
    startDate: '',
    expiryDate: '',
    usageLimit: '',
    status: 'ACTIVE'
  });

  const handleOpenModal = (promo?: any) => {
    if (promo) {
      setEditingId(promo.id);
      setFormData({
        code: promo.code,
        description: promo.description || '',
        type: promo.type,
        value: promo.value.toString(),
        minBookingAmt: promo.minBookingAmt?.toString() || '',
        maxDiscount: promo.maxDiscount?.toString() || '',
        minNights: promo.minNights?.toString() || '',
        maxNights: promo.maxNights?.toString() || '',
        startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : '',
        expiryDate: promo.expiryDate ? new Date(promo.expiryDate).toISOString().split('T')[0] : '',
        usageLimit: promo.usageLimit?.toString() || '',
        status: promo.status
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        description: '',
        type: 'FIXED',
        value: '',
        minBookingAmt: '',
        maxDiscount: '',
        minNights: '',
        maxNights: '',
        startDate: '',
        expiryDate: '',
        usageLimit: '',
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/promos/${editingId}` : `/api/promos`;
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        value: Number(formData.value),
        minBookingAmt: formData.minBookingAmt ? Number(formData.minBookingAmt) : null,
        maxDiscount: formData.type === 'PERCENTAGE' && formData.maxDiscount ? Number(formData.maxDiscount) : null,
        minNights: formData.minNights ? Number(formData.minNights) : null,
        maxNights: formData.maxNights ? Number(formData.maxNights) : null,
        startDate: formData.startDate ? formData.startDate : null,
        expiryDate: formData.expiryDate ? formData.expiryDate : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        let errorMsg = `Server error (${res.status})`;
        if (contentType && contentType.includes('application/json')) {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        }
        throw new Error(errorMsg);
      }
      
      setIsModalOpen(false);
      router.refresh();
      
      // Optimistic update for quick UX
      if (contentType && contentType.includes('application/json')) {
        const savedPromo = await res.json();
        if (editingId) {
          setPromos(prev => prev.map(p => p.id === editingId ? savedPromo : p));
        } else {
          setPromos(prev => [...prev, savedPromo]);
        }
      }
    } catch (err) {
      alert('Error saving promo code');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    try {
      const res = await fetch(`/api/promos/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMsg = 'Failed to delete promo code';
        if (contentType && contentType.includes('application/json')) {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        }
        throw new Error(errorMsg);
      }
      
      setPromos(prev => prev.filter(p => p.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting promo code');
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">Promo Codes</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">Manage discount codes and promotional campaigns.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gold text-black font-semibold px-5 py-2.5 rounded-lg hover:scale-105 transition shadow-lg cursor-pointer">
          <Plus className="w-5 h-5" />
          Create Promo
        </button>
      </div>

      <div className="liquid-glass rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-2">
          <Tag className="w-5 h-5 text-gold" />
          <h2 className="text-lg font-medium text-[var(--text-dark)]">All Campaigns ({promos.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Promo Code</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Discount</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Conditions</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Usage</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {promos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--text-sec-dark)]">No promo codes configured. Click "Create Promo" to add one.</td>
                </tr>
              )}
              {promos.map(promo => (
                <tr key={promo.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="font-mono font-bold text-[var(--text-dark)] bg-white/10 px-2 py-1 rounded inline-block">{promo.code}</div>
                    {promo.description && <div className="text-xs text-[var(--text-sec-dark)] mt-1">{promo.description}</div>}
                  </td>
                  <td className="p-4 text-sm text-[var(--text-dark)] font-medium">
                    {promo.type === 'PERCENTAGE' ? `${Number(promo.value)}% Off` : `Flat ₹${Number(promo.value).toLocaleString()}`}
                    {promo.maxDiscount > 0 && <><br/><span className="text-xs text-[var(--text-sec-dark)] font-normal">Max: ₹{Number(promo.maxDiscount).toLocaleString()}</span></>}
                  </td>
                  <td className="p-4 text-xs text-[var(--text-sec-dark)] space-y-1">
                    {promo.minBookingAmt > 0 && <div>Min Booking: <span className="text-white">₹{Number(promo.minBookingAmt).toLocaleString()}</span></div>}
                    {promo.minNights > 0 && <div>Min Nights: <span className="text-white">{promo.minNights}</span></div>}
                    {promo.startDate && <div>Valid from: <span className="text-white">{new Date(promo.startDate).toLocaleDateString()}</span></div>}
                    {promo.expiryDate && <div>Valid till: <span className="text-white">{new Date(promo.expiryDate).toLocaleDateString()}</span></div>}
                    {!promo.expiryDate && !promo.startDate && <div>No Expiry</div>}
                  </td>
                  <td className="p-4 text-sm text-[var(--text-dark)]">
                    {promo.usageCount || 0} / {promo.usageLimit || '∞'}
                    {promo.usageLimit && (
                      <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-gold h-full rounded-full" style={{ width: `${Math.min((promo.usageCount || 0) / promo.usageLimit * 100, 100)}%` }}></div>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      promo.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      promo.status === 'EXPIRED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-white/10 text-[var(--text-sec-dark)] border-white/10'
                    }`}>
                      {promo.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(promo)} className="p-1.5 rounded-md text-[var(--text-sec-dark)] hover:text-white hover:bg-white/10 transition cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(promo.id)} className="p-1.5 rounded-md text-[var(--text-sec-dark)] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C2128] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-serif text-white">{editingId ? 'Edit Promo' : 'Create Promo'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase">Code</label>
                <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white mt-1 uppercase" placeholder="SUMMER50" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase">Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 uppercase">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value, maxDiscount: e.target.value === 'FIXED' ? '' : formData.maxDiscount})} className="w-full bg-[#1C2128] border border-white/10 rounded-lg p-2 text-white mt-1">
                    <option value="FIXED">Fixed Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase">Value</label>
                  <input type="number" min="0" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white mt-1" />
                </div>
              </div>
              {formData.type === 'PERCENTAGE' && (
                <div>
                  <label className="text-xs text-white/50 uppercase">Max Discount (₹)</label>
                  <input type="number" min="0" value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white mt-1" />
                </div>
              )}
              <div>
                <label className="text-xs text-white/50 uppercase">Min Booking Amt</label>
                <input type="number" min="0" value={formData.minBookingAmt} onChange={e => setFormData({...formData, minBookingAmt: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 uppercase">Min Nights</label>
                  <input type="number" min="0" value={formData.minNights} onChange={e => setFormData({...formData, minNights: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase">Max Nights</label>
                  <input type="number" min="0" value={formData.maxNights} onChange={e => setFormData({...formData, maxNights: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 uppercase">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase">Expiry Date</label>
                  <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 uppercase">Max Usage Limit</label>
                  <input type="number" min="0" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value})} placeholder="e.g. 50" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#1C2128] border border-white/10 rounded-lg p-2 text-white mt-1">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-white/5">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-white/70 hover:text-white cursor-pointer">Cancel</button>
              <button onClick={handleSave} className="bg-gold text-black font-semibold px-6 py-2 rounded-lg hover:scale-105 transition cursor-pointer">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
