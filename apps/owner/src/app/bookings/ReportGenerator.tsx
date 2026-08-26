'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Settings2, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const REPORT_TYPES = [
  { id: 'executive', label: '① Executive Order Summary' },
  { id: 'payment', label: '② Payment Report' },
  { id: 'refund', label: '③ Refund Report' },
  { id: 'cancellation', label: '④ Cancellation Report' },
  { id: 'audit', label: '⑤ Audit Report' }
];

const COLUMNS_BY_REPORT: Record<string, { id: string, label: string }[]> = {
  executive: [
    { id: 'orderId', label: 'Order ID' },
    { id: 'customer', label: 'Customer' },
    { id: 'villa', label: 'Villa' },
    { id: 'checkIn', label: 'Check-in' },
    { id: 'checkOut', label: 'Check-out' },
    { id: 'guests', label: 'Guests' },
    { id: 'currentStatus', label: 'Current Status' },
    { id: 'bookingValue', label: 'Booking Value' },
    { id: 'paid', label: 'Paid' },
    { id: 'outstanding', label: 'Outstanding' },
    { id: 'refundDue', label: 'Refund Due' },
    { id: 'refundPaid', label: 'Refund Paid' },
    { id: 'lastAction', label: 'Last Action' },
    { id: 'lastUpdated', label: 'Last Updated' },
  ],
  payment: [
    { id: 'orderId', label: 'Order ID' },
    { id: 'bookingValue', label: 'Booking Value' },
    { id: 'advanceExpected', label: 'Advance Expected' },
    { id: 'advancePaid', label: 'Advance Paid' },
    { id: 'additionalPayments', label: 'Additional Payments' },
    { id: 'totalPaid', label: 'Total Paid' },
    { id: 'outstanding', label: 'Outstanding' },
    { id: 'paymentStatus', label: 'Payment Status' },
  ],
  refund: [
    { id: 'orderId', label: 'Order ID' },
    { id: 'cancellationDate', label: 'Cancellation Date' },
    { id: 'cancelledBy', label: 'Cancelled By' },
    { id: 'originalPaidAmount', label: 'Original Paid Amount' },
    { id: 'refundTier', label: 'Refund Tier' },
    { id: 'refundStatus', label: 'Refund Status' },
    { id: 'refundAmount', label: 'Refund Amount' },
    { id: 'refundPaid', label: 'Refund Paid' },
    { id: 'pendingRefund', label: 'Pending Refund' },
  ],
  cancellation: [
    { id: 'orderId', label: 'Order ID' },
    { id: 'customer', label: 'Customer' },
    { id: 'bookingDates', label: 'Booking Dates' },
    { id: 'cancelledAt', label: 'Cancelled At' },
    { id: 'cancelledBy', label: 'Cancelled By' },
    { id: 'cancellationReason', label: 'Cancellation Reason' },
    { id: 'amountPaid', label: 'Amount Paid' },
    { id: 'refundEligible', label: 'Refund Eligible' },
    { id: 'refundAmount', label: 'Refund Amount' },
    { id: 'refundStatus', label: 'Refund Status' },
  ],
  audit: [
    { id: 'orderId', label: 'Order ID' },
    { id: 'srNo', label: 'Sr No.' },
    { id: 'editTime', label: 'Edit Time' },
    { id: 'action', label: 'Action' },
    { id: 'role', label: 'Role' },
    { id: 'stateChange', label: 'State Change' },
    { id: 'checkInOut', label: 'Check In/Out' },
    { id: 'guests', label: 'Guests' },
    { id: 'paymentType', label: 'Payment Type' },
    { id: 'refundTier', label: 'Refund Tier' },
    { id: 'refundStatus', label: 'Refund Status' },
    { id: 'services', label: 'Services' },
    { id: 'actionAmount', label: 'Action Amount' },
    { id: 'balance', label: 'Balance' },
    { id: 'totalPaid', label: 'Total Paid' },
    { id: 'remainingAmount', label: 'Remaining Amount' },
    { id: 'refundAmount', label: 'Refund Amount' },
    { id: 'refundPaid', label: 'Refund Paid' },
    { id: 'amountToBePaid', label: 'Amount To Be Paid' },
  ]
};

export function ReportGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState('executive');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Default to all columns of the currently selected report type
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    COLUMNS_BY_REPORT['executive'].map(c => c.id)
  );
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // When report type changes, reset columns to that report's default columns
    setSelectedColumns(COLUMNS_BY_REPORT[reportType].map(c => c.id));
  }, [reportType]);

  const handleToggleColumn = (id: string) => {
    setSelectedColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleGenerate = async (format: 'excel' | 'pdf') => {
    if (selectedColumns.length === 0) {
      setError('Please select at least one column.');
      return;
    }
    
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/export-bookings-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType,
          startDate,
          endDate,
          columns: selectedColumns,
          format: format === 'pdf' ? 'json' : 'excel'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const timestamp = new Date().getTime();

      if (format === 'excel') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${timestamp}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const { data } = await response.json();
        
        // Use A3 landscape to provide enough horizontal space for many columns
        const doc = new jsPDF('landscape', 'mm', 'a3');
        
        const tableColumns = COLUMNS_BY_REPORT[reportType]
          .filter(c => selectedColumns.includes(c.id))
          .map(c => c.label);
          
        const tableData = data.map((row: any) => {
          return tableColumns.map(col => row[col] !== undefined ? row[col] : '-');
        });

        doc.text(`${REPORT_TYPES.find(t => t.id === reportType)?.label.substring(2)}`, 14, 15);
        if (startDate || endDate) {
          doc.setFontSize(10);
          doc.text(`Date Range: ${startDate || 'Any'} to ${endDate || 'Any'}`, 14, 22);
        }

        autoTable(doc, {
          head: [tableColumns],
          body: tableData,
          startY: (startDate || endDate) ? 25 : 20,
          styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', minCellWidth: 15 },
          headStyles: { fillColor: [245, 197, 24], textColor: [0, 0, 0] },
          // Specific styling to ensure dates don't wrap to 1 character per line
          columnStyles: {
            0: { minCellWidth: 25 }, // Order ID
          }
        });

        doc.save(`${reportType}_report_${timestamp}.pdf`);
      }
      
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-muted hover:bg-muted text-foreground font-medium px-4 py-2 rounded-lg border border-border transition"
      >
        <Download className="w-4 h-4" />
        Generate Report
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-card backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
              <h3 className="text-xl font-serif text-foreground flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-gold" />
                Generate Custom Report
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Report Type Selector */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Select Report Type</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {REPORT_TYPES.map(rt => (
                    <button
                      key={rt.id}
                      onClick={() => setReportType(rt.id)}
                      className={`text-left p-3 rounded-lg border transition ${
                        reportType === rt.id 
                          ? 'bg-gold/10 border-gold/50 text-foreground font-medium' 
                          : 'bg-muted border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filters */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Date Range (Check-in)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-muted border border-border rounded-lg p-2.5 text-foreground text-sm focus:border-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-muted border border-border rounded-lg p-2.5 text-foreground text-sm focus:border-gold outline-none"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Leave blank to include all dates.</p>
              </div>

              {/* Columns Selector */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Include Columns</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {COLUMNS_BY_REPORT[reportType].map((col) => (
                    <label 
                      key={col.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        selectedColumns.includes(col.id) ? 'bg-gold/10 border-gold/50' : 'bg-muted border-border'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedColumns.includes(col.id)}
                        onChange={() => handleToggleColumn(col.id)}
                        className="w-4 h-4 accent-gold"
                      />
                      <span className="text-sm text-muted-foreground">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex flex-col sm:flex-row justify-end gap-3 shrink-0 bg-muted">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition order-3 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleGenerate('pdf')}
                disabled={isGenerating}
                className="px-4 py-2 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted transition disabled:opacity-50 flex items-center justify-center gap-2 border border-border order-2"
              >
                {isGenerating ? '...' : <><FileText className="w-4 h-4" /> PDF</>}
              </button>
              <button 
                onClick={() => handleGenerate('excel')}
                disabled={isGenerating}
                className="px-6 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-3"
              >
                {isGenerating ? 'Generating...' : <><FileSpreadsheet className="w-4 h-4" /> Excel</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
