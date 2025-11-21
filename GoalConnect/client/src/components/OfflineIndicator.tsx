import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      // Hide notification after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and notification is hidden
  if (isOnline && !showNotification) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        showNotification ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md border-2 ${
          isOnline
            ? 'bg-green-500/90 border-green-600 text-white'
            : 'bg-red-500/90 border-red-600 text-white'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold text-sm">Back Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold text-sm">You're Offline</span>
          </>
        )}
      </div>
    </div>
  );
}
