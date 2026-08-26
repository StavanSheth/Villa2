'use client';
import React, { useState } from 'react';
import { DollarSign, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PricingManager({ initialRules, villas }: { initialRules: any[], villas: any[] }) {
  const [rules, setRules] = useState(initialRules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    villaId: villas.length > 0 ? villas[0].id : '',
    type: 'WEEKDAY',
    price: '',
    minNights: '1',
    startDate: '',
    endDate: '',
  });

  const handleOpenModal = (rule?: any) => {
    if (rule) {
      setEditingId(rule.id);
      setFormData({
        villaId: rule.villaId,
        type: rule.type,
        price: rule.price.toString(),
        minNights: rule.minNights.toString(),
        startDate: rule.startDate ? new Date(rule.startDate).toISOString().split('T')[0] : '',
        endDate: rule.endDate ? new Date(rule.endDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingId(null);
      setFormData({
        villaId: villas.length > 0 ? villas[0].id : '',
        type: 'WEEKDAY',
        price: '',
        minNights: '1',
        startDate: '',
        endDate: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/pricing-rules/${editingId}` : `/api/pricing-rules`;
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = {
        villaId: formData.villaId,
        type: formData.type,
        price: Number(formData.price),
        minNights: Number(formData.minNights),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
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
        const savedRule = await res.json();
        // inject villa data back into rule for display
        savedRule.villa = villas.find(v => v.id === savedRule.villaId);
        if (editingId) {
          setRules(prev => prev.map(r => r.id === editingId ? savedRule : r));
        } else {
          setRules(prev => [...prev, savedRule]);
        }
      }
    } catch (err) {
      alert('Error saving pricing rule');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      const res = await fetch(`/api/pricing-rules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      setRules(prev => prev.filter(r => r.id !== id));
      router.refresh();
    } catch (err) {
      alert('Error deleting pricing rule');
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Pricing Matrix</h1>
          <p className="text-muted-foreground mt-1">Configure your daily rates, seasonal changes, and custom pricing.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gold text-black font-semibold px-5 py-2.5 rounded-lg hover:scale-105 transition shadow-lg cursor-pointer">
          <Plus className="w-5 h-5" />
          Add Rule
        </button>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-border bg-muted flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gold" />
          <h2 className="text-lg font-medium text-foreground">Active Rules ({rules.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price (INR)</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Range</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rules.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No pricing rules configured. Click "Add Rule" to configure one.</td>
                </tr>
              )}
              {rules.map(rule => (
                <tr key={rule.id} className="hover:bg-muted transition-colors group">
                  <td className="p-4 font-medium text-foreground">{rule.villa?.name}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {rule.type}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gold">
                    ₹{Number(rule.price).toLocaleString()}
                    <div className="text-xs text-muted-foreground font-normal mt-1">Min {rule.minNights} Nights</div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {rule.startDate && rule.endDate 
                      ? `${new Date(rule.startDate).toLocaleDateString()} - ${new Date(rule.endDate).toLocaleDateString()}` 
                      : rule.startDate ? `From ${new Date(rule.startDate).toLocaleDateString()}` 
                      : rule.endDate ? `Until ${new Date(rule.endDate).toLocaleDateString()}`
                      : 'Always'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 transition-opacity">
                      <button onClick={() => handleOpenModal(rule)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer">
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
        <div className="fixed inset-0 bg-card backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="text-xl font-serif text-foreground">{editingId ? 'Edit Pricing Rule' : 'Add Pricing Rule'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs text-muted-foreground uppercase">Villa / Property</label>
                <select value={formData.villaId} onChange={e => setFormData({...formData, villaId: e.target.value})} className="w-full bg-card border border-border rounded-lg p-2 text-foreground mt-1">
                  <option value="" disabled>Select a Villa</option>
                  {villas.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase">Rule Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-card border border-border rounded-lg p-2 text-foreground mt-1">
                    <option value="WEEKDAY">Weekday (Default)</option>
                    <option value="WEEKEND">Weekend</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="CUSTOM">Custom Range / Override</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase">Price (₹ per night)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-muted border border-border rounded-lg p-2 text-foreground mt-1" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase">Start Date <span className="text-muted-foreground lowercase">(optional)</span></label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-muted border border-border rounded-lg p-2 text-foreground mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase">End Date <span className="text-muted-foreground lowercase">(optional)</span></label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-muted border border-border rounded-lg p-2 text-foreground mt-1" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase">Minimum Nights</label>
                <input type="number" value={formData.minNights} onChange={e => setFormData({...formData, minNights: e.target.value})} className="w-full bg-muted border border-border rounded-lg p-2 text-foreground mt-1" />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-4 bg-muted shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
              <button onClick={handleSave} className="bg-gold text-black font-semibold px-6 py-2 rounded-lg hover:scale-105 transition cursor-pointer">Save Rule</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
