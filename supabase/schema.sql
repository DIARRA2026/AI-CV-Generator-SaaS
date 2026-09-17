-- =========================================================================
-- ARCHITECTURE BASE DE DONNÉES SUPABASE POSTGRESQL - MonCV.ai SaaS
-- Développé et Propulsé par INNOVA GROUP
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE DES PROFILS UTILISATEURS (Liée à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  country TEXT DEFAULT 'Côte d''Ivoire',
  city TEXT DEFAULT 'Abidjan',
  profession TEXT,
  plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', '1500', '2500', '5000')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE DES CVS CERTIFIÉS ATS
CREATE TABLE IF NOT EXISTS public.resumes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Mon CV Professionnel',
  slug TEXT UNIQUE NOT NULL,
  resume_data JSONB NOT NULL,
  ats_score INT DEFAULT 85,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE DES PORTFOLIOS WEB D'ÉLITE
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  portfolio_config JSONB NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE DES LETTRES DE MOTIVATION (MÉTHODE STAR)
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  letter_content TEXT NOT NULL,
  star_method BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE DES DEMANDES D'EMPLOI OFFICIELLES
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_title TEXT NOT NULL,
  institution TEXT NOT NULL,
  application_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLE DES TRANSACTIONS MOBILE MONEY
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan_tier TEXT NOT NULL,
  amount_xof INT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('wave', 'orange', 'mtn', 'moov', 'stripe')),
  phone_number TEXT,
  reference_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLE DES ABONNEMENTS ET SOUSCRIPTIONS (Liée à auth.users)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', '1500', '2500', '5000', 'enterprise30', 'enterprise75', 'enterprise200', 'cyber15')),
  amount INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  payment_method TEXT NOT NULL DEFAULT 'Wave Mobile Money (CI)',
  phone_number TEXT,
  transaction_ref TEXT UNIQUE NOT NULL,
  allowed_candidates INT DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- =========================================================================
-- POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- Isolation stricte des données candidates selon les standards RGPD
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques Profiles
CREATE POLICY "Lecture profils propriétaire" 
  ON public.profiles FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Création profil utilisateur" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Mise à jour profil utilisateur" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

-- Déclencheur anti-usurpation de plan_tier sur profiles
CREATE OR REPLACE FUNCTION public.protect_profile_plan_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF NEW.plan_tier IS DISTINCT FROM OLD.plan_tier THEN
      RAISE EXCEPTION 'Modification non autorisée du plan_tier.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_plan_tier ON public.profiles;
CREATE TRIGGER trg_protect_profile_plan_tier
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_plan_tier();

-- Politiques Resumes
CREATE POLICY "Lecture CVs publics et propriétaires"
  ON public.resumes FOR SELECT
  USING (
    is_public = true
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Insertion CVs propriétaire"
  ON public.resumes FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Mise à jour CVs propriétaire"
  ON public.resumes FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Suppression CVs propriétaire"
  ON public.resumes FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

-- Politiques Portfolios
CREATE POLICY "Les utilisateurs gèrent leurs propres portfolios" 
  ON public.portfolios FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Tout le monde peut voir un portfolio publié" 
  ON public.portfolios FOR SELECT USING (is_published = true OR auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques Lettres de Motivation & Demandes d'Emploi
CREATE POLICY "Isolation stricte des lettres de motivation" 
  ON public.cover_letters FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Isolation stricte des demandes d'emploi" 
  ON public.job_applications FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques Transactions
CREATE POLICY "Lecture transactions propriétaire" 
  ON public.transactions FOR SELECT 
  USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR auth.role() = 'service_role');

CREATE POLICY "Insertion transactions contrôlée" 
  ON public.transactions FOR INSERT 
  WITH CHECK ((auth.uid() IS NOT NULL AND auth.uid() = user_id AND status = 'pending') OR auth.role() = 'service_role');

CREATE POLICY "Mise à jour transactions réservée au backend"
  ON public.transactions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Politiques Subscriptions
CREATE POLICY "Lecture souscriptions propriétaire et service"
  ON public.subscriptions FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.jwt() ->> 'email' IS NOT NULL AND user_email = (auth.jwt() ->> 'email'))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Insertion souscription sécurisée"
  ON public.subscriptions FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id AND status = 'pending')
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Mise à jour souscription réservée au backend"
  ON public.subscriptions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =========================================================================
-- DÉCLENCHEUR (TRIGGER) POUR LA CRÉATION AUTOMATIQUE DU PROFIL LORS DU SIGNUP
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    email, 
    phone, 
    country, 
    city,
    plan_tier
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'country', 'Côte d''Ivoire'),
    COALESCE(new.raw_user_meta_data->>'city', 'Abidjan'),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Révocation stricte des droits d'appel public RPC sur la fonction
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Déclencheur après inscription dans auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- INDEX DE PERFORMANCE POUR RECHERCHE ULTRA-RAPIDE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_resumes_slug ON public.resumes(slug);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_slug ON public.portfolios(slug);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON public.transactions(reference_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_email ON public.subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ref ON public.subscriptions(transaction_ref);
