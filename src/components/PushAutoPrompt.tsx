import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * Mounts globally. As soon as a user is authenticated and the browser supports
 * push, we prompt once and subscribe by default. Tracked via localStorage so
 * we never re-prompt the same browser.
 */
const PushAutoPrompt = () => {
  const push = usePushNotifications();

  useEffect(() => {
    if (!push.supported || push.busy || push.subscribed) return;
    if (push.permission === "denied") return;

    const key = "lootboxx_push_auto_prompted_v2";
    if (localStorage.getItem(key)) return;

    let cancelled = false;
    const tryPrompt = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      // Small delay so it doesn't fire on the very first paint
      setTimeout(() => {
        if (cancelled) return;
        localStorage.setItem(key, "1");
        push.subscribe().catch(() => { /* user can toggle in Settings */ });
      }, 4000);
    };
    tryPrompt();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) tryPrompt();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [push.supported, push.permission, push.subscribed, push.busy]);

  return null;
};

export default PushAutoPrompt;
