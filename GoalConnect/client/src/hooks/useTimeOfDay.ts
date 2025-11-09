import { useState, useEffect } from 'react';
import { getTimeOfDay, TimeOfDay } from '@/lib/timeOfDay';

export function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());

  useEffect(() => {
    // Update immediately
    const updateTime = () => {
      const newTime = getTimeOfDay();
      if (newTime !== timeOfDay) {
        setTimeOfDay(newTime);
        document.documentElement.setAttribute('data-time', newTime);
      }
    };

    updateTime();

    // Check every minute for time changes
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [timeOfDay]);

  return timeOfDay;
}
