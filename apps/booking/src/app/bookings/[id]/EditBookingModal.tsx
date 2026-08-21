'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Edit3, X, Sparkles, Plus, Minus } from 'lucide-react';

interface ServiceDef {
  id: string;
  name: string;
  price: number;
  chargeType: string;
  type: string;
  description?: string;
}

interface EditBookingModalProps {
  bookingCode: string;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
  initialServices?: { serviceId: string; name?: string; quantity: number }[];
}

export function EditBookingModal({
  bookingCode,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialServices = [],
}: EditBookingModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(initialCheckIn.split('T')[0]);
  const [checkOut, setCheckOut] = useState(initialCheckOut.split('T')[0]);
  const [guests, setGuests] = useState(initialGuests);
  
  const [allServices, setAllServices] = useState<ServiceDef[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [serviceQuantities, setServiceQuantities] = useState<Map<string, number>>(new Map());

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCheckIn(initialCheckIn.split('T')[0]);
    setCheckOut(initialCheckOut.split('T')[0]);
    setGuests(initialGuests);

    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllServices(data);
          const selectedSet = new Set<string>();
          const qtyMap = new Map<string, number>();

          initialServices.forEach((initSvc) => {
            const match = data.find(
              (d: any) => d.id === initSvc.serviceId || (initSvc.name && d.name.toLowerCase() === initSvc.name.toLowerCase())
            );
            if (match) {
              selectedSet.add(match.id);
              qtyMap.set(match.id, initSvc.quantity || 1);
            } else if (initSvc.serviceId) {
              selectedSet.add(initSvc.serviceId);
              qtyMap.set(initSvc.serviceId, initSvc.quantity || 1);
            }
          });

          setSelectedServiceIds(selectedSet);
          setServiceQuantities(qtyMap);
        }
      })
      .catch(console.error);
  }, [initialCheckIn, initialCheckOut, initialGuests, initialServices]);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!serviceQuantities.has(id)) {
          setServiceQuantities((q) => new Map(q).set(id, 1));
        }
      }
      return next;
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setServiceQuantities((prev) => {
      const next = new Map(prev);
      const current = next.get(id) || 1;
      const val = Math.max(1, current + delta);
      next.set(id, val);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const selectedSvcs = Array.from(selectedServiceIds).map((id) => ({
        serviceDefId: id,
        quantity: serviceQuantities.get(id) || 1,
      }));

      const res = await fetch(`/api/bookings/${bookingCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EDIT_BOOKING',
          actorRole: 'CUSTOMER',
          metadata: {
            checkIn,
            checkOut,
            totalGuests: guests,
            selectedServices: selectedSvcs,
          },
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errText = 'Failed to update booking details';
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          errText = data.error || errText;
        }
        throw new Error(errText);
      }

      alert('Reservation details & services updated successfully! Price breakdown recalculated.');
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error updating reservation');
    } finally {
      setIsSaving(false);
    }
  };

  const paidServices = allServices.filter((s) => s.type === 'PAID');

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 rounded-lg text-sm font-bold flex items-center gap-2 transition cursor-pointer"
      >
        <Edit3 size={16} /> Edit Reservation
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#161b22] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold font-serif text-white">Edit Reservation Details</h3>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Check-In Date */}
              <div>
                <label className="block text-xs uppercase text-white/60 font-semibold mb-1 flex items-center gap-1">
                  <Calendar size={14} /> Check-In Date
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold"
                />
              </div>

              {/* Check-Out Date */}
              <div>
                <label className="block text-xs uppercase text-white/60 font-semibold mb-1 flex items-center gap-1">
                  <Calendar size={14} /> Check-Out Date
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold"
                />
              </div>

              {/* Number of Members / Guests */}
              <div>
                <label className="block text-xs uppercase text-white/60 font-semibold mb-1 flex items-center gap-1">
                  <Users size={14} /> Number of Members / Guests
                </label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition text-lg"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono font-bold text-lg text-gold">{guests} Guests</span>
                  <button
                    type="button"
                    onClick={() => setGuests((g) => g + 1)}
                    className="w-9 h-9 bg-gold text-black font-bold rounded-lg transition text-lg hover:brightness-110"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Paid Add-on Services (Barbeque, Extra Beds, etc.) */}
              <div>
                <label className="block text-xs uppercase text-white/60 font-semibold mb-2 flex items-center gap-1">
                  <Sparkles size={14} className="text-gold" /> Paid Add-ons & Extra Services
                </label>
                <div className="space-y-3">
                  {paidServices.map((svc) => {
                    const isSelected = selectedServiceIds.has(svc.id);
                    const qty = serviceQuantities.get(svc.id) || 1;
                    const unitPrice = Number(svc.price);
                    const isQuantityService = svc.chargeType === 'PER_GUEST' || svc.name.toLowerCase().includes('bed') || svc.name.toLowerCase().includes('mattress');

                    return (
                      <div
                        key={svc.id}
                        className={`p-3 rounded-xl border transition ${
                          isSelected ? 'border-gold/50 bg-gold/5' : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleService(svc.id)}
                              className="w-4 h-4 accent-gold cursor-pointer"
                            />
                            <div>
                              <div className="text-sm font-bold text-white">{svc.name}</div>
                              <div className="text-xs text-gold/80">
                                ₹{unitPrice.toLocaleString()}/{svc.chargeType === 'PER_DAY' ? 'day' : 'unit'}
                              </div>
                            </div>
                          </div>

                          {isSelected && isQuantityService && (
                            <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-2 py-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => updateQuantity(svc.id, -1)}
                                className="w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-mono font-bold text-white px-1">{qty}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(svc.id, 1)}
                                className="w-6 h-6 flex items-center justify-center rounded bg-gold text-black font-bold text-xs hover:brightness-110 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-white/10 text-white/70 text-sm font-medium rounded-lg hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={handleSave}
                className="px-5 py-2 bg-[#D4AF37] text-black font-bold text-sm rounded-lg hover:bg-yellow-600 transition shadow-lg disabled:opacity-50"
              >
                {isSaving ? 'Recalculating...' : 'Save & Recalculate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
