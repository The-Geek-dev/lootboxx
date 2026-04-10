import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

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
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

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

  const createNotification = async (title: string, message: string, type = "info") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("notifications").insert({
      user_id: session.user.id,
      title,
      message,
      type,
    });
    fetchNotifications();
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, createNotification, fetchNotifications };
};
