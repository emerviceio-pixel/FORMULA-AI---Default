// client/src/hooks/useCountdown.js
import { useState, useEffect, useRef } from 'react';

export const useCountdown = (targetTimestamp, onExpire) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [formattedTime, setFormattedTime] = useState('');
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false); // Track if we've already triggered expire

  // Update ref when onExpire changes
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Format time in hours and minutes
    const formatTimeRemaining = (ms) => {
    if (ms <= 0) return null;
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
    };

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset expired flag when target changes
    expiredRef.current = false;

    // If no target timestamp, reset state
    if (!targetTimestamp) {
      setTimeLeft(null);
      setFormattedTime('');
      return;
    }

    // Calculate initial time left
    const calculateTimeLeft = () => {
      const now = Date.now();
      const remaining = targetTimestamp - now;
      return remaining > 0 ? remaining : 0;
    };

    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);
    setFormattedTime(formatTimeRemaining(initialTimeLeft));

    // If already expired, trigger onExpire (only once)
    if (initialTimeLeft <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      if (onExpireRef.current) onExpireRef.current();
      return;
    }

    // Set up interval for live updates
    intervalRef.current = setInterval(() => {
      const remaining = calculateTimeLeft();
      
      if (remaining <= 0) {
        // Timer expired
        setTimeLeft(0);
        setFormattedTime(null);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Trigger expire callback only once
        if (!expiredRef.current) {
          expiredRef.current = true;
          if (onExpireRef.current) onExpireRef.current();
        }
      } else {
        setTimeLeft(remaining);
        setFormattedTime(formatTimeRemaining(remaining));
      }
    }, 1000);

    // Cleanup on unmount or when targetTimestamp changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [targetTimestamp]);

  return { timeLeft, formattedTime };
};