import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Module-level audio context so it survives re-renders and is reused
let audioCtx: AudioContext | null = null;
let audioPrimed = false;

const getAudioCtx = () => {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Prime audio on first user interaction (required by browser autoplay policy)
const primeAudio = () => {
  if (audioPrimed) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  audioPrimed = true;
  // Play a silent buffer to unlock
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
};

if (typeof window !== "undefined") {
  const handler = () => {
    primeAudio();
    window.removeEventListener("click", handler);
    window.removeEventListener("touchstart", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("click", handler);
  window.addEventListener("touchstart", handler);
  window.addEventListener("keydown", handler);
}

export const NOTIFICATION_SOUND_KEY = "lootboxx_notif_sound";

export const isNotificationSoundEnabled = () => {
  try { return localStorage.getItem(NOTIFICATION_SOUND_KEY) !== "false"; } catch { return true; }
};

export const playNotificationSound = () => {
  if (!isNotificationSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  // Pleasant two-tone chime
  const notes = [
    { freq: 880, duration: 0.18, gain: 0.18 },
    { freq: 1175, duration: 0.28, gain: 0.18 },
  ];
  let offset = 0;
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(note.freq, ctx.currentTime + offset);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(note.gain, ctx.currentTime + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + note.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + note.duration + 0.02);
    offset += note.duration * 0.6;
  }
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    userIdRef.current = session.user.id;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
    setLoading(false);
    initialLoadDoneRef.current = true;
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime subscription — play sound on new notification
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      channel = supabase
        .channel(`notifications:${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as any;
            setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
            setUnreadCount((c) => c + 1);
            // Only play sound after initial load to avoid blasting on mount
            if (initialLoadDoneRef.current) {
              try { playNotificationSound(); } catch {}
            }
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);
    fetchNotifications();
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, fetchNotifications };
};
