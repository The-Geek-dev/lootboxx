-- Conversations
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  guest_token TEXT,
  guest_name TEXT,
  guest_email TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  ai_paused BOOLEAN NOT NULL DEFAULT false,
  admin_unread_count INTEGER NOT NULL DEFAULT 0,
  user_unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chat_conv_owner_check CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL)
);

CREATE INDEX idx_chat_conv_user ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_conv_guest ON public.chat_conversations(guest_token);
CREATE INDEX idx_chat_conv_last_msg ON public.chat_conversations(last_message_at DESC);

-- Messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'ai', 'admin')),
  sender_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_msg_conv ON public.chat_messages(conversation_id, created_at);

-- RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users view own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create a conversation"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND user_id IS NULL AND guest_token IS NOT NULL)
  );

CREATE POLICY "Users can update own conversation flags"
  ON public.chat_conversations FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Messages policies
CREATE POLICY "Read messages of own conversations"
  ON public.chat_messages FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Insert own user messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_role = 'user'
    AND EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
        AND (c.user_id = auth.uid() OR (auth.uid() IS NULL AND c.user_id IS NULL))
    )
  );

CREATE POLICY "Admins insert admin messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_role = 'admin' AND public.has_role(auth.uid(), 'admin')
  );

-- Updated_at trigger
CREATE TRIGGER trg_chat_conv_updated
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;