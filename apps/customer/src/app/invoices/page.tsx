import React from 'react';
import { FileText, Download } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">Invoices</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">Download your GST-compliant invoices and payment receipts.</p>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl p-8 mt-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/30 mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-medium text-[var(--text-dark)] mb-2">No Invoices Yet</h2>
        <p className="text-[var(--text-sec-dark)] max-w-sm">Invoices will be generated and available here automatically after your stay is completed.</p>
      </div>
    </div>
  );
}
