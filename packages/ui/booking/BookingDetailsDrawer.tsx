'use client';
import React from 'react';
import {
  X, Calendar, Users, CreditCard, FileText, Clock,
  Edit3, Trash2, RefreshCw, UserPlus, StickyNote,
} from 'lucide-react';
import { BOOKING_TYPE_RULES, type BookingType, type BookingStatus } from '@villa-platform/types';

// ── Types ──
interface BookingDetails {
  id: string;
  bookingCode: string;
  bookingType: BookingType;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  totalGuests: number;
  totalAmount: number;
  paidAmount: number;
  paymentRequired: boolean;
  bookingSource: string;
  bookingReason?: string;
  internalNotes?: string;
  guestName?: string;
  guestEmail?: string;
  assignedStaffId?: string;
  assignedCaretakerId?: string;
  createdByRole?: string;
  createdAt: string;
  events?: Array<{
    action: string;
    actorRole: string;
    createdAt: string;
    metadata?: any;
  }>;
  services?: Array<{
    name: string;
    totalPrice: number;
  }>;
}

interface BookingDetailsDrawerProps {
  booking: BookingDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string, bookingId: string) => void;
  mode?: 'CUSTOMER' | 'OWNER' | 'STAFF';
}

// ── Status Badge Colors ──
const STATUS_COLORS: Partial<Record<string, string>> = {
  DRAFT:            'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  PENDING:          'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  AWAITING_PAYMENT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ADVANCE_PAID:     'bg-blue-500/20 text-blue-400 border-blue-500/30',
  FULLY_PAID:       'bg-green-500/20 text-green-400 border-green-500/30',
  CONFIRMED:        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  UPCOMING:         'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CHECKED_IN:       'bg-purple-500/20 text-purple-400 border-purple-500/30',
  CHECKED_OUT:      'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  COMPLETED:        'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELLED:        'bg-red-500/20 text-red-400 border-red-500/30',
};

export const BookingDetailsDrawer: React.FC<BookingDetailsDrawerProps> = ({
  booking,
  isOpen,
  onClose,
  onAction,
  mode = 'CUSTOMER',
}) => {
  if (!booking) return null;

  const rules = BOOKING_TYPE_RULES[booking.bookingType];
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const balance = booking.totalAmount - booking.paidAmount;

  const handleAction = (action: string) => {
    onAction?.(action, booking.id);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-md bg-[var(--bg-dark)] border-l border-white/10
        z-50 transform transition-transform duration-300 ease-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-dark)]/95 backdrop-blur-md border-b border-white/10 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-[var(--text-sec-dark)]">{booking.bookingCode}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[booking.status] || ''}`}>
                  {booking.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[var(--text-sec-dark)]">
                  {rules?.label || booking.bookingType}
                </span>
                <span className="text-xs text-[var(--text-sec-dark)]">
                  via {booking.bookingSource}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-sec-dark)] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Dates ── */}
          <div className="liquid-glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-[var(--text-dark)]">Dates</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-[var(--text-sec-dark)]">Check-in</div>
                <div className="text-[var(--text-dark)] font-medium">
                  {checkIn.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-sec-dark)]">Check-out</div>
                <div className="text-[var(--text-dark)] font-medium">
                  {checkOut.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="text-xs text-[var(--text-sec-dark)] mt-2">{nights} Night{nights !== 1 ? 's' : ''}</div>
          </div>

          {/* ── Guests ── */}
          <div className="liquid-glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-[var(--text-dark)]">Guests</span>
            </div>
            <div className="text-sm text-[var(--text-dark)]">{booking.totalGuests} Guest{booking.totalGuests !== 1 ? 's' : ''}</div>
            {booking.guestName && (
              <div className="text-xs text-[var(--text-sec-dark)] mt-1">
                {booking.guestName} {booking.guestEmail ? `(${booking.guestEmail})` : ''}
              </div>
            )}
          </div>

          {/* ── Services ── */}
          {booking.services && booking.services.length > 0 && (
            <div className="liquid-glass rounded-xl p-4">
              <div className="text-sm font-medium text-[var(--text-dark)] mb-3">Services</div>
              {booking.services.map((svc, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-[var(--text-sec-dark)]">{svc.name}</span>
                  <span className="text-[var(--text-dark)]">₹{svc.totalPrice.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Payment ── */}
          <div className="liquid-glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-[var(--text-dark)]">Payment</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-sec-dark)]">Total Amount</span>
                <span className="text-[var(--text-dark)] font-bold">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-sec-dark)]">Paid</span>
                <span className="text-green-400">₹{booking.paidAmount.toLocaleString()}</span>
              </div>
              {balance > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-sec-dark)]">Balance</span>
                  <span className="text-red-400">₹{balance.toLocaleString()}</span>
                </div>
              )}
              {!booking.paymentRequired && (
                <div className="text-xs text-yellow-400 mt-1">Payment not required for this booking type</div>
              )}
            </div>
          </div>

          {/* ── Reason (Maintenance, Blocked) ── */}
          {booking.bookingReason && (
            <div className="liquid-glass rounded-xl p-4">
              <div className="text-sm font-medium text-[var(--text-dark)] mb-2">Reason</div>
              <div className="text-sm text-[var(--text-sec-dark)]">{booking.bookingReason}</div>
            </div>
          )}

          {/* ── Internal Notes (Owner/Staff only) ── */}
          {mode !== 'CUSTOMER' && booking.internalNotes && (
            <div className="liquid-glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-[var(--text-dark)]">Internal Notes</span>
              </div>
              <div className="text-xs text-[var(--text-sec-dark)] whitespace-pre-line">{booking.internalNotes}</div>
            </div>
          )}

          {/* ── Timeline ── */}
          {booking.events && booking.events.length > 0 && (
            <div className="liquid-glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-[var(--text-dark)]">Timeline</span>
              </div>
              <div className="space-y-3">
                {booking.events.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-gold mt-1.5 shrink-0" />
                    <div>
                      <div className="text-xs text-[var(--text-dark)] font-medium">{event.action}</div>
                      <div className="text-[10px] text-[var(--text-sec-dark)]">
                        {event.actorRole} · {new Date(event.createdAt).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Owner Actions ── */}
          {mode !== 'CUSTOMER' && (
            <div className="space-y-2 pt-4 border-t border-white/10">
              <div className="text-xs text-[var(--text-sec-dark)] uppercase tracking-wider mb-3">Actions</div>

              <div className="grid grid-cols-2 gap-2">
                <ActionButton icon={Edit3} label="Edit Dates" onClick={() => handleAction('EDIT_DATES')} />
                <ActionButton icon={Users} label="Edit Guests" onClick={() => handleAction('EDIT_GUESTS')} />
                <ActionButton icon={CreditCard} label="Collect Payment" onClick={() => handleAction('COLLECT_PAYMENT')}
                  disabled={!booking.paymentRequired || booking.paidAmount >= booking.totalAmount} />
                <ActionButton icon={FileText} label="Generate Invoice" onClick={() => handleAction('GENERATE_INVOICE')} />
                <ActionButton icon={Trash2} label="Cancel Booking" onClick={() => handleAction('CANCEL')}
                  variant="danger" disabled={booking.status === 'CANCELLED' || booking.status === 'COMPLETED'} />
                <ActionButton icon={RefreshCw} label="Convert Type" onClick={() => handleAction('CONVERT_TYPE')} />
                <ActionButton icon={UserPlus} label="Assign Staff" onClick={() => handleAction('ASSIGN_STAFF')} />
                <ActionButton icon={StickyNote} label="Add Notes" onClick={() => handleAction('ADD_NOTES')} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Helper: Action Button ──
const ActionButton: React.FC<{
  icon: any;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}> = ({ icon: Icon, label, onClick, variant = 'default', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition
      ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      ${variant === 'danger'
        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
        : 'bg-white/5 text-[var(--text-dark)] border border-white/10 hover:bg-white/10'}
    `}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);
