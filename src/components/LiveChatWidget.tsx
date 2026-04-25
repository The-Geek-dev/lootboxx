import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, User as UserIcon, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const GUEST_TOKEN_KEY = "lb_chat_guest_token";
const CONV_ID_KEY = "lb_chat_conversation_id";

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_role: "user" | "ai" | "admin";
  content: string;
  created_at: string;
};

const getOrCreateGuestToken = () => {
  let t = localStorage.getItem(GUEST_TOKEN_KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(GUEST_TOKEN_KEY, t);
  }
  return t;
};

const LiveChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    localStorage.getItem(CONV_ID_KEY),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Detect auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load existing messages
  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
  }, []);

  useEffect(() => {
    if (conversationId && open) loadMessages(conversationId);
  }, [conversationId, open, loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
          if (msg.sender_role !== "user") setAiThinking(false);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, aiThinking]);

  const ensureConversation = async (): Promise<string | null> => {
    if (conversationId) return conversationId;

    // Logged-in users don't need to share name
    if (!userId && !guestName.trim()) {
      setNeedsName(true);
      return null;
    }

    const guestToken = userId ? null : getOrCreateGuestToken();
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: userId,
        guest_token: guestToken,
        guest_name: userId ? null : guestName.trim() || "Guest",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to create conversation", error);
      return null;
    }
    localStorage.setItem(CONV_ID_KEY, data.id);
    setConversationId(data.id);
    setNeedsName(false);

    // Seed welcome message (AI)
    await supabase.from("chat_messages").insert({
      conversation_id: data.id,
      sender_role: "ai",
      content: `Hi${userId ? "" : ` ${guestName.trim() || "there"}`}! I'm the LootBoxx assistant. How can I help today? An admin will jump in if needed.`,
    });

    return data.id;
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const convId = await ensureConversation();
      if (!convId) return;

      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: convId,
        sender_role: "user",
        content: text,
      });
      if (error) throw error;

      // Update conversation preview & bump admin unread
      await supabase
        .from("chat_conversations")
        .update({
          last_message_preview: text.slice(0, 140),
          last_message_at: new Date().toISOString(),
          admin_unread_count: (await supabase
            .from("chat_conversations")
            .select("admin_unread_count")
            .eq("id", convId)
            .single()).data?.admin_unread_count
              ? ((await supabase
                  .from("chat_conversations")
                  .select("admin_unread_count")
                  .eq("id", convId)
                  .single()).data!.admin_unread_count as number) + 1
              : 1,
        })
        .eq("id", convId);

      setInput("");
      setAiThinking(true);

      // Trigger AI reply (fire and forget — realtime delivers result)
      supabase.functions
        .invoke("chat-ai-reply", { body: { conversation_id: convId } })
        .catch((e) => {
          console.error("AI reply failed", e);
          setAiThinking(false);
        });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 flex items-center justify-center hover:shadow-primary/60 transition-shadow"
        aria-label="Open live chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[32rem] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border-b border-border">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Headset className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">LootBoxx Support</p>
                <p className="text-xs text-muted-foreground">AI + human admin</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {needsName && !conversationId && (
                <div className="text-sm text-muted-foreground space-y-2 bg-muted/30 p-3 rounded-lg">
                  <p>What's your name? (so we can address you properly)</p>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your name"
                    className="bg-background"
                  />
                </div>
              )}
              {!conversationId && !needsName && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <Bot className="w-10 h-10 mx-auto mb-2 text-primary" />
                  <p>Send your first message to start the chat.</p>
                  <p className="text-xs mt-1">An AI will reply instantly. A human admin can take over anytime.</p>
                </div>
              )}
              {messages.map((m) => {
                const mine = m.sender_role === "user";
                return (
                  <div
                    key={m.id}
                    className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}
                  >
                    {!mine && (
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-auto",
                        m.sender_role === "admin" ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/20 text-primary",
                      )}>
                        {m.sender_role === "admin" ? <Headset className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : m.sender_role === "admin"
                          ? "bg-emerald-500/10 text-foreground rounded-bl-sm border border-emerald-500/30"
                          : "bg-muted text-foreground rounded-bl-sm",
                      )}
                    >
                      {m.sender_role === "admin" && (
                        <p className="text-[10px] uppercase tracking-wide font-semibold text-emerald-600 mb-0.5">Admin</p>
                      )}
                      {m.content}
                    </div>
                    {mine && (
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-auto">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
              {aiThinking && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-muted rounded-2xl px-3 py-2 text-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder={needsName ? "Enter your name first..." : "Type a message..."}
                disabled={sending || (needsName && !guestName.trim())}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={sending || !input.trim()} size="icon">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LiveChatWidget;
