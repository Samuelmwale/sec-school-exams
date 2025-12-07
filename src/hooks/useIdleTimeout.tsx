import { useEffect, useCallback, useRef } from "react";

export const useIdleTimeout = (
  onTimeout: () => void,
  timeoutMinutes: number = 10
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMinutes * 60 * 1000);
  }, [onTimeout, timeoutMinutes]);

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    
    const handleActivity = () => resetTimer();
    
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    
    resetTimer();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);

  return { resetTimer };
};
