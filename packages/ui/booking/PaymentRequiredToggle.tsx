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
    <div className="bg-card border border-border shadow-sm rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {value ? (
            <CreditCard className="w-5 h-5 text-gold" />
          ) : (
            <Ban className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <div className="text-sm font-medium text-foreground">
              Payment Required
            </div>
            <div className="text-xs text-muted-foreground">
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
            ${value ? 'bg-gold' : 'bg-muted'}
          `}
          role="switch"
          aria-checked={value}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-card shadow transition-transform duration-200
              ${value ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </div>
  );
};
