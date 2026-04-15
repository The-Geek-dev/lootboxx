import { useState, useEffect } from "react";

// Launch at midnight tonight (user's local time)
function getMidnightTonight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
}

const LAUNCH_DATE = getMidnightTonight();

export function useLaunchStatus() {
  const [isLaunched, setIsLaunched] = useState(LAUNCH_DATE.getTime() <= Date.now());

  useEffect(() => {
    if (isLaunched) return;
    const interval = setInterval(() => {
      if (LAUNCH_DATE.getTime() <= Date.now()) {
        setIsLaunched(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLaunched]);

  return { isLaunched, launchDate: LAUNCH_DATE };
}

export function getTimeUntilLaunch() {
  const diff = LAUNCH_DATE.getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, launched: true };
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    launched: false,
  };
}
