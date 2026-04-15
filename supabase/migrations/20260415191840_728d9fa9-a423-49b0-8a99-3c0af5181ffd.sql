
-- 1. Restrict faq_feedback SELECT to admin-only
DROP POLICY IF EXISTS "Authenticated users can view feedback" ON public.faq_feedback;

CREATE POLICY "Admins can view all feedback"
ON public.faq_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Restrict notifications INSERT to service_role only
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);
