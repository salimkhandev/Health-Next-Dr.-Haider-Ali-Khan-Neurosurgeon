'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Use a ref so the offline handler always reads the latest pathname
  // without needing to re-attach the event listener on every navigation
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial status from browser API
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);

    const handleOffline = () => {
      setIsOnline(false);

      const current = pathnameRef.current;
      // Pages that work fully offline (cached text pages or offline video player)
      const allowedOfflinePaths = ['/downloads', '/about', '/privacy', '/terms', '/refund'];
      const isAllowed =
        current === '/' ||
        allowedOfflinePaths.some(p => current?.startsWith(p)) ||
        current?.startsWith('/watch/');

      if (!isAllowed) {
        router.push('/downloads');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // Only run once on mount — pathname changes are tracked via ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return isOnline;
}
