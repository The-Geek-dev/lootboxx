import { useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// Module-level reference so non-React code can trigger the prompt on demand.
let subscribeRef: (() => Promise<boolean | undefined>) | null = null;
let permissionRef: NotificationPermission = "default";
let supportedRef = false;
let subscribedRef = false;
let busyRef = false;

/**
 * Call this after high-intent moments (e.g. after signup, or when a user
 * clicks a promo CTA) to request push permission. Respects browser state:
 * skips if already subscribed, denied, unsupported, or busy.
 */
export const requestPushSubscription = async (): Promise<boolean> => {
  if (!supportedRef || busyRef || subscribedRef) return false;
  if (permissionRef === "denied") return false;
  if (!subscribeRef) return false;
  try {
    const result = await subscribeRef();
    return result === true;
  } catch {
    return false;
  }
};

/**
 * No longer auto-prompts on page load. Mounts silently so that
 * requestPushSubscription() can be called later from signup / promo flows.
 */
const PushAutoPrompt = () => {
  const push = usePushNotifications();

  useEffect(() => {
    subscribeRef = push.subscribe;
    permissionRef = push.permission;
    supportedRef = push.supported;
    subscribedRef = push.subscribed;
    busyRef = push.busy;
  }, [push.subscribe, push.permission, push.supported, push.subscribed, push.busy]);

  return null;
};

export default PushAutoPrompt;
