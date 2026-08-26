'use client';
import React, { useState } from 'react';
import { Sparkles, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ServiceManager({ initialServices }: { initialServices: any[] }) {
  const [services, setServices] = useState(initialServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'FOOD',
    type: 'PAID',
    chargeType: 'PER_BOOKING',
    price: '',
    taxable: true,
  });

  const handleOpenModal = (svc?: any) => {
    if (svc) {
      setEditingId(svc.id);
      setFormData({
        name: svc.name,
        description: svc.description || '',
        category: svc.category || 'FOOD',
        type: svc.type,
        chargeType: svc.chargeType,
        price: svc.price.toString(),
        taxable: svc.taxable,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        category: 'FOOD',
        type: 'PAID',
        chargeType: 'PER_BOOKING',
        price: '',
        taxable: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/services/${editingId}` : '/api/services';
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        chargeType: formData.chargeType,
        price: Number(formData.price),
        taxable: formData.taxable,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save service');
      
      const savedService = await res.json();
      
      if (editingId) {
        setServices(prev => prev.map(s => s.id === editingId ? savedService : s));
      } else {
        setServices(prev => [...prev, savedService]);
      }
      
      setIsModalOpen(false);
      router.refresh();
    } catch (err) {
      alert('Error saving service');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      setServices(prev => prev.filter(s => s.id !== id));
      router.refresh();
    } catch (err) {
      alert('Error deleting service');
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Services & Add-ons</h1>
          <p className="text-muted-foreground mt-1">Manage extra services, food options, and complementary amenities.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gold text-black font-semibold px-5 py-2.5 rounded-lg hover:scale-105 transition shadow-lg cursor-pointer">
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-border bg-muted flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          <h2 className="text-lg font-medium text-foreground">Configured Services ({services.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service Name</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Taxable</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No services found.</td>
                </tr>
              )}
              {services.map((svc) => (
                <tr key={svc.id} className="hover:bg-muted transition-colors group">
                  <td className="p-4">
                    <div className="font-medium text-foreground">{svc.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{svc.description}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${svc.type === 'COMPLIMENTARY' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                      {svc.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{svc.category}</td>
                  <td className="p-4">
                    {svc.type === 'PAID' ? (
                      <div className="font-bold text-gold">₹{Number(svc.price).toLocaleString()} <span className="text-xs text-muted-foreground font-normal">/ {svc.chargeType.replace('PER_', '').toLowerCase()}</span></div>
                    ) : (
                      <div className="font-bold text-green-400">Free</div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{svc.taxable ? 'Yes' : 'No'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(svc)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(svc.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer">
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
              <h3 className="text-xl font-serif text-foreground">{editingId ? 'Edit Service' : 'Add Service'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs text-muted-foreground uppercase">Service Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-muted border border-border rounded-lg p-2 text-foreground mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase">Description (optional)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-muted border border-border rounded-lg p-2 text-foreground mt-1 h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-card border border-border rounded-lg p-2 text-foreground mt-1">
                    <option value="FOOD">Food</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="ACTIVITY">Activity</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="DECORATION">Decoration</option>
                    <option value="COMFORT">Comfort</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-card border border-border rounded-lg p-2 text-foreground mt-1">
                    <option value="PAID">Paid</option>
                    <option value="COMPLIMENTARY">Complimentary</option>
                  </select>
                </div>
              </div>
              
              {formData.type === 'PAID' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase">Charge Type</label>
                    <select value={formData.chargeType} onChange={e => setFormData({...formData, chargeType: e.target.value})} className="w-full bg-card border border-border rounded-lg p-2 text-foreground mt-1">
                      <option value="PER_BOOKING">Per Booking</option>
                      <option value="PER_DAY">Per Day</option>
                      <option value="PER_GUEST">Per Guest</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase">Price (?)</label>
                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-muted border border-border rounded-lg p-2 text-foreground mt-1" />
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="taxable" checked={formData.taxable} onChange={e => setFormData({...formData, taxable: e.target.checked})} className="w-4 h-4 accent-gold" />
                <label htmlFor="taxable" className="text-sm text-foreground">This service is subject to GST/Tax</label>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-4 bg-muted shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
              <button onClick={handleSave} className="bg-gold text-black font-semibold px-6 py-2 rounded-lg hover:scale-105 transition cursor-pointer">Save Service</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
