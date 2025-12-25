-- Add comment column to faq_feedback table
ALTER TABLE public.faq_feedback
ADD COLUMN comment TEXT;