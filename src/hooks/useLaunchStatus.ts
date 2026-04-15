export function useLaunchStatus() {
  return { isLaunched: true, launchDate: new Date() };
}

export function getTimeUntilLaunch() {
  return { hours: 0, minutes: 0, seconds: 0, launched: true };
}
