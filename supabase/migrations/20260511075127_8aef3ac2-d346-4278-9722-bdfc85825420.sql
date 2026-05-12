
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles (replaces "Users" custom table; auth handled by Supabase)
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  group_user_name TEXT UNIQUE NOT NULL,
  group_display_name TEXT NOT NULL,
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_id TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_pref_channel TEXT CHECK (contact_pref_channel IN ('SMS','WhatsApp','Email')),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- Allow public lookup of username->email mapping is done via SECURITY DEFINER function instead.

-- Quiz session
CREATE TABLE public.quiz_session (
  session_id BIGSERIAL PRIMARY KEY,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_session ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read sessions" ON public.quiz_session FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write sessions" ON public.quiz_session FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Quiz
CREATE TABLE public.quiz (
  quiz_id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES public.quiz_session(session_id) ON DELETE SET NULL,
  subject VARCHAR(500) NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read quiz" ON public.quiz FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write quiz" ON public.quiz FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Questions
CREATE TABLE public.questions (
  quiz_id BIGINT NOT NULL REFERENCES public.quiz(quiz_id) ON DELETE CASCADE,
  question_num INT NOT NULL,
  question_text TEXT NOT NULL,
  answers TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  PRIMARY KEY (quiz_id, question_num)
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write questions" ON public.questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Score
CREATE TABLE public.score (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id BIGINT NOT NULL REFERENCES public.quiz_session(session_id) ON DELETE CASCADE,
  last_update_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  score INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, session_id)
);
ALTER TABLE public.score ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own score" ON public.score FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users upsert own score" ON public.score FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own score" ON public.score FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- System definitions
CREATE TABLE public.system_definitions (
  id INT PRIMARY KEY DEFAULT 1,
  question_timeout INT NOT NULL DEFAULT 25,
  CHECK (id = 1)
);
ALTER TABLE public.system_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read defs" ON public.system_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write defs" ON public.system_definitions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.system_definitions (id, question_timeout) VALUES (1, 25);

-- Memorial content
CREATE TABLE public.memorial_content (
  content_id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.memorial_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read memorial" ON public.memorial_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write memorial" ON public.memorial_content FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto-assign default 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: lookup email by group_user_name (used during login)
CREATE OR REPLACE FUNCTION public.email_for_username(_username TEXT)
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.email FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE p.group_user_name = _username LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.email_for_username(TEXT) TO anon, authenticated;
