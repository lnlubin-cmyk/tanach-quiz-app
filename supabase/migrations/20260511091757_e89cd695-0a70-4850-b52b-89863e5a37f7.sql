CREATE TABLE public.quiz_attempt (
  user_id uuid NOT NULL,
  quiz_id bigint NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quiz_id)
);

ALTER TABLE public.quiz_attempt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own attempts" ON public.quiz_attempt
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users insert own attempts" ON public.quiz_attempt
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());