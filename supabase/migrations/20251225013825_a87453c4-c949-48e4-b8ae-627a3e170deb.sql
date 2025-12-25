-- Create table for FAQ feedback
CREATE TABLE public.faq_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  session_id TEXT
);

-- Enable RLS
ALTER TABLE public.faq_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (anonymous feedback)
CREATE POLICY "Anyone can submit feedback"
ON public.faq_feedback
FOR INSERT
WITH CHECK (true);

-- Only authenticated users or admins can view feedback (for analytics)
CREATE POLICY "Authenticated users can view feedback"
ON public.faq_feedback
FOR SELECT
TO authenticated
USING (true);

-- Create index for faster queries
CREATE INDEX idx_faq_feedback_question ON public.faq_feedback(question_id);
CREATE INDEX idx_faq_feedback_helpful ON public.faq_feedback(question_id, is_helpful);