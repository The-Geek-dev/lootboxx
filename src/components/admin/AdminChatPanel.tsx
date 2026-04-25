import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, Loader2, Bot, User as UserIcon, Headset, Pause, Play, Bell, BellOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Conversation = {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  status: string;
  ai_paused: boolean;
  admin_unread_count: number;
  last_message_preview: string | null;
  last_message_at: string;
  created_at: string;
};

type Msg = {
  id: string;
  conversation_id: string;
  sender_role: "user" | "ai" | "admin";
  content: string;
  created_at: string;
};

const playBuzz = () => {
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o.start(); o.stop(ctx.currentTime + 0.3);
  } catch {/* ignore */}
};

const AdminChatPanel = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Push permission state
  useEffect(() => {
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const requestPush = async () => {
    if (!("Notification" in window)) {
      toast({ title: "Notifications not supported", variant: "destructive" });
      return;
    }
    const perm = await Notification.requestPermission();
    setPushEnabled(perm === "granted");
    if (perm === "granted") {
      toast({ title: "Browser notifications enabled" });
    }
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("chat_conversations")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(100);
    if (data) setConversations(data as Conversation[]);
  }, []);

  // Load messages for active conversation
  const loadMessages = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Msg[]);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { if (activeId) loadMessages(activeId); }, [activeId, loadMessages]);

  // Realtime: new messages anywhere
  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const msg = payload.new as Msg;
        if (msg.conversation_id === activeId) {
          setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        }
        if (msg.sender_role === "user") {
          // Buzz + push for new user messages
          playBuzz();
          if (pushEnabled && document.hidden) {
            try {
              new Notification("New LootBoxx chat message", {
                body: msg.content.slice(0, 120),
                tag: msg.conversation_id,
              });
            } catch {/* ignore */}
          }
          toast({ title: "💬 New chat message", description: msg.content.slice(0, 80) });
          loadConversations();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => {
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId, pushEnabled, loadConversations]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Open conversation -> clear admin unread
  const openConversation = async (c: Conversation) => {
    setActiveId(c.id);
    if (c.admin_unread_count > 0) {
      await supabase
        .from("chat_conversations")
        .update({ admin_unread_count: 0 })
        .eq("id", c.id);
    }
  };

  const sendReply = async () => {
    if (!activeId || !reply.trim() || sending) return;
    setSending(true);
    try {
      const text = reply.trim();
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: activeId,
        sender_role: "admin",
        content: text,
      });
      if (error) throw error;

      // Pause AI + update preview
      await supabase
        .from("chat_conversations")
        .update({
          ai_paused: true,
          last_message_preview: text.slice(0, 140),
          last_message_at: new Date().toISOString(),
        })
        .eq("id", activeId);

      setReply("");
      toast({ title: "Reply sent (AI paused)" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const toggleAi = async () => {
    if (!activeId) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;
    await supabase
      .from("chat_conversations")
      .update({ ai_paused: !conv.ai_paused })
      .eq("id", activeId);
    toast({ title: conv.ai_paused ? "AI auto-replies resumed" : "AI auto-replies paused" });
  };

  const active = conversations.find((c) => c.id === activeId);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div>
          <h3 className="font-semibold">Live Chat</h3>
          <p className="text-xs text-muted-foreground">
            {conversations.length} conversation{conversations.length === 1 ? "" : "s"} · realtime
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={requestPush}>
          {pushEnabled ? <Bell className="w-4 h-4 mr-1.5" /> : <BellOff className="w-4 h-4 mr-1.5" />}
          {pushEnabled ? "Push on" : "Enable push"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 h-[32rem]">
        {/* Conversations list */}
        <div className="border-r border-border overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            {conversations.length === 0 && (
              <p className="text-sm text-muted-foreground p-4">No conversations yet.</p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c)}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors",
                  activeId === c.id && "bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {c.guest_name || (c.user_id ? `User ${c.user_id.slice(0, 8)}` : "Guest")}
                  </span>
                  {c.admin_unread_count > 0 && (
                    <Badge className="h-5 px-1.5 text-[10px]">{c.admin_unread_count}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {c.last_message_preview || "No messages yet"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.last_message_at).toLocaleString()}
                  </span>
                  {c.ai_paused && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">AI paused</Badge>
                  )}
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Active conversation */}
        <div className="md:col-span-2 flex flex-col">
          {!active && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select a conversation to view messages
            </div>
          )}
          {active && (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <div>
                  <p className="font-semibold text-sm">
                    {active.guest_name || (active.user_id ? `User ${active.user_id.slice(0, 8)}` : "Guest")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Started {new Date(active.created_at).toLocaleString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={toggleAi}>
                  {active.ai_paused ? <Play className="w-3.5 h-3.5 mr-1" /> : <Pause className="w-3.5 h-3.5 mr-1" />}
                  {active.ai_paused ? "Resume AI" : "Pause AI"}
                </Button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background">
                {messages.map((m) => {
                  const adminMsg = m.sender_role === "admin";
                  const userMsg = m.sender_role === "user";
                  return (
                    <div
                      key={m.id}
                      className={cn("flex gap-2", adminMsg ? "justify-end" : "justify-start")}
                    >
                      {!adminMsg && (
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-auto",
                          userMsg ? "bg-blue-500/20 text-blue-500" : "bg-primary/20 text-primary",
                        )}>
                          {userMsg ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                          adminMsg
                            ? "bg-emerald-500 text-white rounded-br-sm"
                            : userMsg
                            ? "bg-blue-500/10 border border-blue-500/30 text-foreground rounded-bl-sm"
                            : "bg-muted text-foreground rounded-bl-sm",
                        )}
                      >
                        <p className="text-[10px] uppercase tracking-wide font-semibold opacity-60 mb-0.5">
                          {m.sender_role}
                        </p>
                        {m.content}
                      </div>
                      {adminMsg && (
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-auto">
                          <Headset className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendReply(); } }}
                  placeholder="Reply as admin (pauses AI)..."
                  disabled={sending}
                />
                <Button onClick={sendReply} disabled={sending || !reply.trim()} size="icon">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AdminChatPanel;
