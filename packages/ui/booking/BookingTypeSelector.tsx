'use client';
import React from 'react';
import {
  BOOKING_TYPE_RULES,
  OWNER_BOOKING_TYPES,
  type BookingType,
} from '@villa-platform/types';
import {
  Home, Wrench, Ban, Star, Phone, Building2, User, ShieldCheck,
} from 'lucide-react';

interface BookingTypeSelectorProps {
  value: BookingType;
  onChange: (type: BookingType) => void;
  disabledTypes?: BookingType[];
}

const BOOKING_TYPE_ICONS: Partial<Record<BookingType, any>> = {
  NORMAL:      Home,
  OWNER:       ShieldCheck,
  PRIVATE:     User,
  MAINTENANCE: Wrench,
  BLOCKED:     Ban,
  VIP:         Star,
  OFFLINE:     Phone,
  CORPORATE:   Building2,
};

export const BookingTypeSelector: React.FC<BookingTypeSelectorProps> = ({
  value,
  onChange,
  disabledTypes = [],
}) => {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-[var(--text-dark)]">Booking Type</h2>
        <p className="text-[var(--text-sec-dark)] mt-2">Select the type of reservation you're creating.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OWNER_BOOKING_TYPES.map((type) => {
          const rules = BOOKING_TYPE_RULES[type];
          const Icon = BOOKING_TYPE_ICONS[type] || Home;
          const isSelected = value === type;
          const isDisabled = disabledTypes.includes(type);

          return (
            <button
              key={type}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(type)}
              className={`
                p-4 rounded-xl text-left transition-all duration-200 border-2 flex items-start gap-3
                ${isSelected
                  ? 'border-gold bg-gold/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                ${isSelected ? 'bg-gold/20 text-gold' : 'bg-white/10 text-[var(--text-sec-dark)]'}
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${isSelected ? 'text-gold' : 'text-[var(--text-dark)]'}`}>
                  {rules.label}
                </div>
                <div className="text-xs text-[var(--text-sec-dark)] mt-0.5 line-clamp-2">
                  {rules.description}
                </div>
                {/* Rule badges */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {!rules.paymentRequired && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      No Payment
                    </span>
                  )}
                  {rules.autoConfirm && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Auto-Confirm
                    </span>
                  )}
                  {!rules.promoEnabled && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-500/20 text-neutral-400 border border-neutral-500/30">
                      No Promo
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
