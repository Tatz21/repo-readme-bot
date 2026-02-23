
-- Profiles table for user branding/settings
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  custom_logo_url TEXT,
  custom_footer TEXT,
  custom_color_scheme JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- README history table
CREATE TABLE public.readme_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  readme_content TEXT NOT NULL,
  options JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  score INTEGER,
  score_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.readme_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own history" ON public.readme_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own history" ON public.readme_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own history" ON public.readme_history FOR DELETE USING (auth.uid() = user_id);

-- Shared READMEs (publicly accessible via unique slug)
CREATE TABLE public.shared_readmes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  readme_content TEXT NOT NULL,
  branding JSONB DEFAULT '{}',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_readmes ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared readmes (public sharing)
CREATE POLICY "Anyone can view shared readmes" ON public.shared_readmes FOR SELECT USING (true);
CREATE POLICY "Users can insert shared readmes" ON public.shared_readmes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their shared readmes" ON public.shared_readmes FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_readme_history_user ON public.readme_history(user_id, created_at DESC);
CREATE INDEX idx_readme_history_repo ON public.readme_history(repo_url);
CREATE INDEX idx_shared_readmes_slug ON public.shared_readmes(slug);

-- Trigger for profile updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
