'use client';
import React from 'react';
import { CreditCard, Ban } from 'lucide-react';

interface PaymentRequiredToggleProps {
  value: boolean;
  onChange: (required: boolean) => void;
  disabled?: boolean;
}

export const PaymentRequiredToggle: React.FC<PaymentRequiredToggleProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="liquid-glass rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {value ? (
            <CreditCard className="w-5 h-5 text-gold" />
          ) : (
            <Ban className="w-5 h-5 text-[var(--text-sec-dark)]" />
          )}
          <div>
            <div className="text-sm font-medium text-[var(--text-dark)]">
              Payment Required
            </div>
            <div className="text-xs text-[var(--text-sec-dark)]">
              {value
                ? 'Customer will be asked to pay via Razorpay or offline.'
                : 'Booking will be confirmed without payment.'}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(!value)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${value ? 'bg-gold' : 'bg-white/20'}
          `}
          role="switch"
          aria-checked={value}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
              ${value ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </div>
  );
};
