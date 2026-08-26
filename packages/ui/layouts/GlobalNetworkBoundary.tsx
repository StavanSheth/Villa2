'use client';

import React, { useEffect, useState } from 'react';

export function GlobalNetworkBoundary({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    const handleNetworkError = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToastMessage(customEvent.detail?.message || "Server not working. Changes not saved.");
      setTimeout(() => setToastMessage(null), 5000);
    };

    window.addEventListener('network-error', handleNetworkError);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('network-error', handleNetworkError);
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-2 text-sm font-medium shadow-md">
          You are currently offline. The app is in read-only mode.
        </div>
      )}
      
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm border border-gray-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {toastMessage}
        </div>
      )}

      <div className={isOffline ? 'pointer-events-none opacity-80' : ''}>
        {children}
      </div>
    </>
  );
}
