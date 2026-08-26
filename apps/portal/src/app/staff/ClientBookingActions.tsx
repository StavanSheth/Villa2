'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, X, Loader2, AlertCircle } from 'lucide-react';

export default function ClientBookingActions({ booking, missingCount, rawIdProofs, checkInTime, remainingAmount = 0 }: any) {
  const router = useRouter();
  
  // States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [collectCash, setCollectCash] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isMounted, setIsMounted] = useState(false);

  // Update current time every minute to accurately enable the button 30 mins prior
  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const checkInDate = new Date(checkInTime);
  const thirtyMinsBeforeCheckIn = checkInDate.getTime() - 30 * 60 * 1000;
  const isTimeValid = currentTime >= thirtyMinsBeforeCheckIn;

  const allVerified = rawIdProofs && rawIdProofs.length > 0 && rawIdProofs.every((p: any) => p.status === 'VERIFIED');
  const canCheckIn = isTimeValid && missingCount === 0 && allVerified;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload-direct', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload file');
      }
      const { publicUrl } = await uploadRes.json();

      const dbRes = await fetch('/api/id-proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          fileUrl: publicUrl,
          fileType: file.type,
          guestName: 'Additional Guest'
        })
      });

      if (!dbRes.ok) {
        const err = await dbRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save ID proof to database');
      }

      setIsUploadModalOpen(false);
      router.refresh();
      
    } catch (error) {
      console.error(error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (proofId: string) => {
    try {
      setVerifyingId(proofId);
      
      const dbRes = await fetch('/api/id-proofs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofId,
          status: 'VERIFIED'
        })
      });

      if (!dbRes.ok) {
        const errData = await dbRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to verify document');
      }
      
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true);
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId: booking.id,
          collectCash: collectCash ? remainingAmount : 0
        })
      });

      if (!res.ok) throw new Error('Failed to initiate check-in');

      setIsCheckInModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to initiate check-in.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <>
      <div className="bg-muted px-6 py-4 flex flex-wrap items-center justify-end gap-3 border-t border-border">
        
        {missingCount > 0 && (
          <button 
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-red-500 hover:bg-red-600 rounded transition-colors shadow-sm flex items-center gap-2 mr-auto"
          >
            <Upload className="w-4 h-4" />
            Upload Missing Docs ({missingCount})
          </button>
        )}

        <button 
          type="button"
          onClick={() => setIsVerifyModalOpen(true)}
          className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-card hover:bg-muted rounded transition-colors border border-border shadow-sm flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Verify Documents
        </button>
        
        <div className="relative group">
          <button 
            type="button"
            onClick={() => canCheckIn && setIsCheckInModalOpen(true)}
            disabled={!canCheckIn}
            className={`px-5 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-sm flex items-center gap-2
              ${canCheckIn 
                ? 'text-primary-foreground bg-primary hover:brightness-110 cursor-pointer' 
                : 'text-muted-foreground bg-muted cursor-not-allowed border border-border'}`}
          >
            Initiate Check-in
          </button>
          
          {/* Tooltip explaining why it's disabled */}
          {!canCheckIn && (
            <div className="absolute bottom-full mb-2 right-0 w-64 bg-popover text-popover-foreground text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
              <ul className="space-y-1">
                <li className={isTimeValid ? 'text-green-400' : 'text-red-400'}>
                  {isTimeValid ? '✓ Time valid' : '✗ Too early (Must be within 30m of Check-in)'}
                </li>
                <li className={missingCount === 0 ? 'text-green-400' : 'text-red-400'}>
                  {missingCount === 0 ? '✓ All adult IDs uploaded' : `✗ Missing ${missingCount} adult IDs`}
                </li>
                <li className={allVerified ? 'text-green-400' : 'text-red-400'}>
                  {allVerified ? '✓ All IDs verified' : '✗ IDs pending verification'}
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {isMounted && document.body && createPortal(
        <>
          {/* Upload Modal */}
          {isUploadModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
              <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-serif text-primary mb-2">Upload Missing ID</h3>
                <p className="text-sm text-muted-foreground mb-6">Upload a photo ID for the missing adult guest. Supported formats: JPG, PNG.</p>
                
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors relative bg-muted">
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                      <span className="text-sm font-medium text-muted-foreground">Uploading to Secure Storage...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                      <span className="text-sm font-medium text-foreground block mb-1">Click or drag image here</span>
                      <span className="text-xs text-muted-foreground">Max size: 5MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Verify Documents Modal */}
          {isVerifyModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
              <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full p-6 relative animate-fade-in my-8">
                <button type="button" onClick={() => setIsVerifyModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-serif text-primary mb-2">Verify Guest Documents</h3>
                <p className="text-sm text-muted-foreground mb-6">Review the uploaded ID proofs. Click Verify once you have checked them against the guest.</p>
                
                {rawIdProofs && rawIdProofs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rawIdProofs.map((proof: any) => (
                      <div key={proof.id} className="border border-border rounded-xl overflow-hidden bg-muted flex flex-col">
                        <div 
                          onClick={() => setSelectedImage(proof.fileUrl)}
                          className="block h-48 bg-muted relative group overflow-hidden cursor-pointer"
                        >
                          <img src={proof.fileUrl} alt="ID Proof" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white font-semibold text-sm">Click to View Full Size</span>
                          </div>
                          {proof.status === 'VERIFIED' && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md z-10">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground truncate mb-1">{proof.guestName || 'Guest'}</p>
                            <p className="text-xs text-muted-foreground mb-4">Uploaded on {new Date(proof.uploadedAt).toLocaleDateString()}</p>
                          </div>
                          
                          {proof.status !== 'VERIFIED' ? (
                            <button 
                              type="button"
                              onClick={() => handleVerify(proof.id)}
                              disabled={verifyingId === proof.id}
                              className="w-full py-2 bg-primary hover:brightness-110 text-primary-foreground text-sm font-semibold rounded shadow-sm transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                              {verifyingId === proof.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Okay (Verify)'}
                            </button>
                          ) : (
                            <button type="button" disabled className="w-full py-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded flex justify-center items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Verified
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted rounded-xl border border-dashed border-border">
                    <p className="text-muted-foreground text-sm">No documents have been uploaded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Check In Confirmation Modal */}
          {isCheckInModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
              <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
                <button type="button" onClick={() => setIsCheckInModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-serif text-primary mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirm Check-in
                </h3>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6 mt-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    Has the Damage Deposit been collected?
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Initiating check-in signifies that you have physically collected the cash or UPI damage deposit.
                  </p>
                </div>
                
                {remainingAmount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id={`collect-cash-${booking.id}`}
                      className="mt-1 w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                      checked={collectCash}
                      onChange={(e) => setCollectCash(e.target.checked)}
                    />
                    <label htmlFor={`collect-cash-${booking.id}`} className="cursor-pointer">
                      <p className="text-sm text-blue-900 font-semibold">
                        Collect Remaining Balance (₹{remainingAmount.toLocaleString('en-IN')})
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Check this box if you have received the remaining balance in cash. This will update the ledger and sync with the payment gateway.
                      </p>
                    </label>
                  </div>
                )}
                
                <div className="flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsCheckInModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-muted-foreground bg-card hover:bg-muted border border-border rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleCheckIn}
                    disabled={isCheckingIn}
                    className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 rounded shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Check-in'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lightbox Image Viewer Modal */}
          {selectedImage && (
            <div 
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" 
              onClick={() => setSelectedImage(null)}
            >
              <button 
                type="button" 
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
              >
                <X className="w-8 h-8" />
              </button>
              <img 
                src={selectedImage} 
                alt="Full Size ID Proof" 
                className="max-w-full max-h-full object-contain shadow-2xl rounded"
                onClick={(e) => e.stopPropagation()} 
              />
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}
