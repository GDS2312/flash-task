import { useEffect, useRef, useCallback } from 'react';

export function useNotification() {
  const grantedRef = useRef(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      grantedRef.current = true;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    grantedRef.current = result === 'granted';
    return grantedRef.current;
  }, []);

  const notify = useCallback((title: string, options?: { body?: string; tag?: string }) => {
    if (!grantedRef.current) return;
    try {
      new Notification(title, {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>',
        ...options,
      });
    } catch {
      // Fallback silently
    }
  }, []);

  // Check for tasks due soon and notify
  const checkReminders = useCallback(() => {
    // This will be called from the main app loop
  }, []);

  return { requestPermission, notify, checkReminders, isGranted: grantedRef.current };
}
