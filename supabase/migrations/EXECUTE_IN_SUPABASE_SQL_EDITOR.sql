-- =========================================================================
-- MONCV.AI — MASTER DEPLOYMENT SCRIPT POUR SUPABASE SQL EDITOR
-- Innova Group SARL • MonCV.ai SaaS Platform
-- Architecture : Next.js 14 + Supabase SSR + Passerelle KKiaPay + AI Coins Wallet
--
-- INSTRUCTIONS :
-- 1. Ouvrez votre Dashboard Supabase : https://supabase.com/dashboard/project/otgxrewddogacbsgteyz/sql
-- 2. Cliquez sur 'New query' (Nouvelle requête)
-- 3. Copiez-collez l'intégralité de ce fichier et cliquez sur 'RUN' (ou Ctrl + Enter)
-- 4. Tout est exécuté avec idempotence (IF NOT EXISTS / OR REPLACE / ON CONFLICT).
-- =========================================================================

-- =========================================================================
-- MONCV.AI — MASTER SCHEMA POSTGRESQL & POLITIQUES RLS CONSOLIDÉES
-- INNOVA GROUP SARL (RCCM CI-BKE-2019-A-228 • IFU 2400000X)
-- Architecture : Next.js 14 + Supabase SSR + Passerelle KKiaPay + RLS Strict
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. PROFILS UTILISATEURS (public.profiles)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  city TEXT DEFAULT 'Abidjan',
  country TEXT DEFAULT 'Côte d''Ivoire',
  profession TEXT,
  account_type TEXT NOT NULL DEFAULT 'candidate' CHECK (account_type IN ('candidate', 'business', 'admin')),
  plan_tier TEXT NOT NULL DEFAULT 'free',
  credits INT NOT NULL DEFAULT 30 CHECK (credits >= 0),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan_tier);

-- =========================================================================
-- 2. PLANS & FORMULES TARIFAIRES (public.plans)
-- Source de vérité des prix et quotas
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_xof INT NOT NULL CHECK (price_xof >= 0),
  duration_days INT NOT NULL DEFAULT 30,
  credits INT NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.plans (id, name, price_xof, duration_days, credits, features, is_active) VALUES
  (
    'essentiel',
    'Essentiel',
    1500,
    30,
    120,
    '["120 crédits valables 30 jours", "12 CV complets ou 24 lettres de motivation", "Création manuelle & exports PDF/Word illimités", "Score ATS instantané", "Facture normalisée OHADA"]'::jsonb,
    TRUE
  ),
  (
    'pro',
    'Pro',
    2500,
    30,
    250,
    '["250 crédits valables 30 jours", "25 CV complets ou 50 lettres de motivation", "Traductions CV en Anglais IA incluses", "Modèles premium & exports sans filigrane", "Facture normalisée OHADA"]'::jsonb,
    TRUE
  ),
  (
    'vip',
    'VIP & Portfolio',
    5000,
    30,
    600,
    '["600 crédits valables 30 jours", "60 CV complets avec Photo de profil IA incluse", "Portfolio Web professionnel en ligne", "Analyses & Réécritures ATS avancées", "Support prioritaire & Facture normalisée OHADA"]'::jsonb,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_xof = EXCLUDED.price_xof,
  duration_days = EXCLUDED.duration_days,
  credits = EXCLUDED.credits,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Alias rétrocompatibles
INSERT INTO public.plans (id, name, price_xof, duration_days, credits, features, is_active) VALUES
  ('evolution', 'Pro', 2500, 30, 250, '["Alias compatible Pro"]'::jsonb, FALSE),
  ('carriere', 'VIP & Portfolio', 5000, 30, 600, '["Alias compatible VIP"]'::jsonb, FALSE)
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 3. COMMANDES ET INTENTIONS DE PAIEMENT (public.orders)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  amount_xof INT NOT NULL CHECK (amount_xof > 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- =========================================================================
-- 4. TRANSACTIONS RÉGLÉES (public.payment_transactions)
-- Unicité sur (provider, transaction_id)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'kkiapay',
  transaction_id TEXT NOT NULL,
  amount_xof INT NOT NULL CHECK (amount_xof >= 0),
  fees_xof INT NOT NULL DEFAULT 0,
  payment_method TEXT,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  raw_reference JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_payment_transactions_provider_tx UNIQUE (provider, transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_tx ON public.payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);

-- =========================================================================
-- 5. ABONNEMENTS MENSUELS 30 JOURS (public.subscriptions)
-- Un seul abonnement actif garanti par index partiel
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES public.plans(id),
  payment_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_single_active
  ON public.subscriptions(user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires
  ON public.subscriptions(expires_at)
  WHERE status = 'active';

-- =========================================================================
-- 6. AUDIT DES ÉVÉNEMENTS WEBHOOKS (public.payment_events)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'kkiapay',
  event_type TEXT NOT NULL,
  transaction_id TEXT,
  payload JSONB NOT NULL,
  headers JSONB,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  process_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_tx ON public.payment_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created ON public.payment_events(created_at DESC);

-- =========================================================================
-- 7. DOCUMENTS DU CANDIDAT (public.resumes / public.cvs)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Mon CV Professionnel',
  slug TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cvs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Mon CV Professionnel',
  slug TEXT UNIQUE NOT NULL,
  cv_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ats_score INT DEFAULT 85,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_email ON public.resumes(email);
CREATE INDEX IF NOT EXISTS idx_resumes_slug ON public.resumes(slug);
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_slug ON public.cvs(slug);

-- =========================================================================
-- 8. PORTFOLIOS EN LIGNE (public.portfolios)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.portfolios (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Mon Portfolio Professionnel',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_slug ON public.portfolios(slug);

-- =========================================================================
-- 9. FACTURES NORMALISÉES OHADA (public.invoices)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  numero TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  claim_id TEXT,
  compte_id TEXT NOT NULL,
  compte_type TEXT NOT NULL DEFAULT 'user' CHECK (compte_type IN ('user', 'org')),
  client_nom TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_rccm TEXT,
  client_ifu TEXT,
  pack_slug TEXT NOT NULL,
  pack_nom TEXT NOT NULL,
  credits INT NOT NULL DEFAULT 0,
  montant_fcfa INT NOT NULL CHECK (montant_fcfa >= 0),
  mode_paiement TEXT NOT NULL DEFAULT 'KKiaPay Mobile Money',
  pdf_url TEXT,
  cree_le TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_compte ON public.invoices(compte_id);
CREATE INDEX IF NOT EXISTS idx_invoices_numero ON public.invoices(numero);

-- =========================================================================
-- 10. ORGANISATIONS & RECRUTEURS B2B (public.organizations)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  rccm TEXT,
  tax_id TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_org_members_user UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

-- =========================================================================
-- 11. ACTIVATION & FORÇAGE DU ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events FORCE ROW LEVEL SECURITY;

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios FORCE ROW LEVEL SECURITY;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members FORCE ROW LEVEL SECURITY;

-- =========================================================================
-- 12. POLITIQUES RLS STRICTES (ISOLATION TOTALE)
-- =========================================================================
-- Plans : lecture publique, écriture service_role
DROP POLICY IF EXISTS "plans_select_all" ON public.plans;
CREATE POLICY "plans_select_all" ON public.plans FOR SELECT USING (TRUE);

-- Profiles : chaque utilisateur ne lit et ne modifie que son profil
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Orders : lecture par le propriétaire ou service_role, aucune modification client
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Payment transactions : lecture propriétaire ou service_role
DROP POLICY IF EXISTS "transactions_select_own" ON public.payment_transactions;
CREATE POLICY "transactions_select_own" ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Subscriptions : lecture propriétaire ou service_role
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Payment events : strictement réservé au backend service_role
DROP POLICY IF EXISTS "events_service_role_only" ON public.payment_events;
CREATE POLICY "events_service_role_only" ON public.payment_events
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- CVs & Resumes : isolation totale du candidat
DROP POLICY IF EXISTS "resumes_select_own" ON public.resumes;
CREATE POLICY "resumes_select_own" ON public.resumes FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid())))
    OR is_public = TRUE
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "resumes_insert_own" ON public.resumes;
CREATE POLICY "resumes_insert_own" ON public.resumes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "resumes_update_own" ON public.resumes;
CREATE POLICY "resumes_update_own" ON public.resumes FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "resumes_delete_own" ON public.resumes;
CREATE POLICY "resumes_delete_own" ON public.resumes FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "cvs_select_own" ON public.cvs;
CREATE POLICY "cvs_select_own" ON public.cvs FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "cvs_insert_own" ON public.cvs;
CREATE POLICY "cvs_insert_own" ON public.cvs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "cvs_update_own" ON public.cvs;
CREATE POLICY "cvs_update_own" ON public.cvs FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "cvs_delete_own" ON public.cvs;
CREATE POLICY "cvs_delete_own" ON public.cvs FOR DELETE
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Portfolios
DROP POLICY IF EXISTS "portfolios_select_own" ON public.portfolios;
CREATE POLICY "portfolios_select_own" ON public.portfolios FOR SELECT
  USING (auth.uid() = user_id OR is_published = TRUE OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "portfolios_insert_own" ON public.portfolios;
CREATE POLICY "portfolios_insert_own" ON public.portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "portfolios_update_own" ON public.portfolios;
CREATE POLICY "portfolios_update_own" ON public.portfolios FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "portfolios_delete_own" ON public.portfolios;
CREATE POLICY "portfolios_delete_own" ON public.portfolios FOR DELETE
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Invoices
DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
CREATE POLICY "invoices_select_own" ON public.invoices FOR SELECT
  USING (
    compte_id = auth.uid()::text
    OR client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- Organisations B2B
DROP POLICY IF EXISTS "orgs_select_members" ON public.organizations;
CREATE POLICY "orgs_select_members" ON public.organizations FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "org_members_select_colleagues" ON public.organization_members;
CREATE POLICY "org_members_select_colleagues" ON public.organization_members FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- =========================================================================
-- 13. SÉCURITÉ : VERROU ANTI-ÉLÉVATION SUR LES PROFILS (TRIGGER)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.protect_profile_rights_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') THEN
    IF (OLD.plan_tier IS DISTINCT FROM NEW.plan_tier) THEN
      RAISE EXCEPTION 'Interdiction formelle : la modification de la formule (plan_tier) est réservée au service_role.';
    END IF;
    IF (OLD.credits < NEW.credits) THEN
      RAISE EXCEPTION 'Interdiction formelle : l ajout de crédits est réservé au service_role.';
    END IF;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profile_rights ON public.profiles;
CREATE TRIGGER trg_protect_profile_rights
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_rights_fn();

-- =========================================================================
-- 14. PROCÉDURE ATOMIQUE DE CONFIRMATION KKIAPAY (RPC)
-- Idempotence absolue, calcul UTC des 30 jours, Facture OHADA, Crédit Pack
-- =========================================================================
CREATE OR REPLACE FUNCTION public.confirm_kkiapay_payment(
  p_order_id UUID,
  p_transaction_id TEXT,
  p_amount INT,
  p_fees INT DEFAULT 0,
  p_payment_method TEXT DEFAULT 'KKiaPay',
  p_environment TEXT DEFAULT 'sandbox',
  p_raw_reference JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  success BOOLEAN,
  order_id UUID,
  plan_id TEXT,
  subscription_id UUID,
  expires_at TIMESTAMPTZ,
  message TEXT
) AS $$
DECLARE
  v_order RECORD;
  v_plan RECORD;
  v_tx_id UUID;
  v_existing_tx RECORD;
  v_existing_sub RECORD;
  v_sub_id UUID;
  v_started_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := timezone('utc', NOW());
  v_user_profile RECORD;
  v_invoice_num TEXT;
  v_client_name TEXT;
  v_client_email TEXT;
BEGIN
  -- 1. Verrou strict sur la commande
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, p_order_id, NULL::TEXT, NULL::UUID, NULL::TIMESTAMPTZ, 'Commande introuvable'::TEXT;
    RETURN;
  END IF;

  -- 2. Contrôle d'idempotence sur la transaction KKiaPay
  SELECT * INTO v_existing_tx
  FROM public.payment_transactions
  WHERE provider = 'kkiapay' AND transaction_id = p_transaction_id;

  IF FOUND THEN
    SELECT s.id, s.plan_id, s.expires_at INTO v_existing_sub
    FROM public.subscriptions s
    WHERE s.payment_id = v_existing_tx.id OR s.order_id = p_order_id
    ORDER BY s.expires_at DESC
    LIMIT 1;

    RETURN QUERY SELECT TRUE, v_order.id, v_order.plan_id, v_existing_sub.id, v_existing_sub.expires_at, 'Commande déjà confirmée (idempotence)'::TEXT;
    RETURN;
  END IF;

  -- 3. Vérification du plan
  SELECT * INTO v_plan
  FROM public.plans
  WHERE id = v_order.plan_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, v_order.id, v_order.plan_id, NULL::UUID, NULL::TIMESTAMPTZ, 'Formule inconnue'::TEXT;
    RETURN;
  END IF;

  -- 4. Enregistrement de la transaction financière
  INSERT INTO public.payment_transactions (
    order_id, user_id, provider, transaction_id, amount_xof, fees_xof,
    payment_method, environment, raw_reference
  ) VALUES (
    v_order.id, v_order.user_id, 'kkiapay', p_transaction_id, p_amount, p_fees,
    p_payment_method, p_environment, p_raw_reference
  ) RETURNING id INTO v_tx_id;

  -- 5. Calcul de la date d'échéance selon les 3 règles métier (30 jours)
  SELECT * INTO v_existing_sub
  FROM public.subscriptions
  WHERE user_id = v_order.user_id AND status = 'active' AND expires_at > v_now
  ORDER BY expires_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing_sub.plan_id = v_order.plan_id THEN
      -- Règle A : Même formule renouvelée par anticipation -> +30 jours ajoutés à l'échéance actuelle
      v_started_at := v_existing_sub.started_at;
      v_expires_at := timezone('utc', v_existing_sub.expires_at) + (v_plan.duration_days || ' days')::INTERVAL;
    ELSE
      -- Règle C : Changement de formule -> Nouveau cycle de 30 jours à partir de maintenant
      UPDATE public.subscriptions SET status = 'expired', updated_at = v_now WHERE id = v_existing_sub.id;
      v_started_at := v_now;
      v_expires_at := v_now + (v_plan.duration_days || ' days')::INTERVAL;
    END IF;
  ELSE
    -- Règle B : Première souscription ou abonnement expiré -> 30 jours à partir de maintenant
    v_started_at := v_now;
    v_expires_at := v_now + (v_plan.duration_days || ' days')::INTERVAL;
  END IF;

  -- 6. Upsert de la souscription active
  IF FOUND AND v_existing_sub.plan_id = v_order.plan_id THEN
    UPDATE public.subscriptions
    SET
      expires_at = v_expires_at,
      payment_id = v_tx_id,
      order_id = v_order.id,
      updated_at = v_now
    WHERE id = v_existing_sub.id
    RETURNING id INTO v_sub_id;
  ELSE
    UPDATE public.subscriptions SET status = 'expired', updated_at = v_now
    WHERE user_id = v_order.user_id AND status = 'active';

    INSERT INTO public.subscriptions (
      user_id, plan_id, payment_id, order_id, status, started_at, expires_at
    ) VALUES (
      v_order.user_id, v_order.plan_id, v_tx_id, v_order.id, 'active', v_started_at, v_expires_at
    ) RETURNING id INTO v_sub_id;
  END IF;

  -- 7. Mise à jour de la commande
  UPDATE public.orders
  SET status = 'paid', updated_at = v_now
  WHERE id = v_order.id;

  -- 8. Mise à jour du profil et attribution des crédits du pack
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = v_order.user_id;

  IF FOUND THEN
    UPDATE public.profiles
    SET
      plan_tier = v_order.plan_id,
      credits = credits + v_plan.credits,
      updated_at = v_now
    WHERE id = v_order.user_id;
  ELSE
    SELECT email INTO v_client_email FROM auth.users WHERE id = v_order.user_id;
    INSERT INTO public.profiles (id, email, plan_tier, credits, account_type)
    VALUES (v_order.user_id, COALESCE(v_client_email, 'user@moncv.ai'), v_order.plan_id, 30 + v_plan.credits, 'candidate')
    ON CONFLICT (id) DO UPDATE SET
      plan_tier = EXCLUDED.plan_tier,
      credits = public.profiles.credits + v_plan.credits,
      updated_at = v_now;
  END IF;

  -- 9. Génération automatique de la facture normalisée OHADA
  v_client_name := COALESCE(TRIM(CONCAT(v_user_profile.first_name, ' ', v_user_profile.last_name)), 'Client MonCV.ai');
  v_client_email := COALESCE(v_user_profile.email, (SELECT email FROM auth.users WHERE id = v_order.user_id), 'client@moncv.ai');
  v_invoice_num := 'INV-' || TO_CHAR(v_now, 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');

  INSERT INTO public.invoices (
    numero, order_id, compte_id, compte_type, client_nom, client_email,
    pack_slug, pack_nom, credits, montant_fcfa, mode_paiement, cree_le
  ) VALUES (
    v_invoice_num, v_order.id, v_order.user_id::TEXT, 'user', v_client_name, v_client_email,
    v_order.plan_id, v_plan.name, v_plan.credits, p_amount, p_payment_method, v_now
  ) ON CONFLICT (numero) DO NOTHING;

  RETURN QUERY SELECT TRUE, v_order.id, v_order.plan_id, v_sub_id, v_expires_at, 'Paiement confirmé et abonnement activé avec succès.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Sécurisation de l'exécution : service_role uniquement
REVOKE ALL ON FUNCTION public.confirm_kkiapay_payment(UUID, TEXT, INT, INT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_kkiapay_payment(UUID, TEXT, INT, INT, TEXT, TEXT, JSONB) TO service_role;


-- =========================================================================
-- DEUXIEME PARTIE : SYSTEME DE MONNAIE VIRTUELLE INTERNE AI COINS & LEDGER
-- Portefeuille unique, grand livre immuable, réservations et RPC atomiques
-- =========================================================================

-- =========================================================================
-- MIGRATION: SYSTEME DE MONNAIE VIRTUELLE INTERNE "AI COINS" / CREDITS IA
-- MonCV.ai — Architecture Hautement Sécurisée & Grand Livre Immuable
-- Date: 2026-10-05
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. TABLE : credit_wallets (Portefeuille Utilisateur Unique)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  available_credits INT NOT NULL DEFAULT 0 CHECK (available_credits >= 0),
  reserved_credits INT NOT NULL DEFAULT 0 CHECK (reserved_credits >= 0),
  lifetime_earned INT NOT NULL DEFAULT 0,
  lifetime_purchased INT NOT NULL DEFAULT 0,
  lifetime_consumed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_wallets_user 
  ON public.credit_wallets (user_id);

-- -------------------------------------------------------------------------
-- 2. TABLE : credit_transactions (Ledger / Grand Livre Comptable Immuable)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.credit_wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'purchase', 'subscription', 'bonus', 'signup_bonus',
    'referral_bonus', 'promotion', 'usage', 'refund',
    'admin_adjustment', 'expiration', 'migration'
  )),
  amount INT NOT NULL,
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  description TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  operation_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created 
  ON public.credit_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_tx_ref 
  ON public.credit_transactions (reference);
CREATE INDEX IF NOT EXISTS idx_credit_tx_operation 
  ON public.credit_transactions (operation_id) WHERE operation_id IS NOT NULL;

-- -------------------------------------------------------------------------
-- 3. TABLE : credit_reservations (Réservations Atomiques à Deux Phases)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.credit_wallets(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  operation_id TEXT UNIQUE NOT NULL,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN (
    'pending', 'reserved', 'processing', 'completed', 'released', 'expired'
  )),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_credit_res_user_status 
  ON public.credit_reservations (user_id, status);
CREATE INDEX IF NOT EXISTS idx_credit_res_operation 
  ON public.credit_reservations (operation_id);
CREATE INDEX IF NOT EXISTS idx_credit_res_expires 
  ON public.credit_reservations (expires_at) WHERE status IN ('reserved', 'processing');

-- -------------------------------------------------------------------------
-- 4. TABLE : credit_packages (Packs d'AI Coins)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  credits INT NOT NULL CHECK (credits > 0),
  price INT NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'FCFA',
  bonus_credits INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialisation des Packs standards AI Coins
INSERT INTO public.credit_packages (slug, name, description, credits, price, currency, bonus_credits, is_active, display_order)
VALUES
  ('decouverte', 'Pack Découverte', 'Pour explorer la plateforme et tester les outils IA', 30, 0, 'FCFA', 0, TRUE, 1),
  ('essentiel', 'Pack Essentiel', 'Idéal pour peaufiner son CV et préparer sa candidature', 120, 1500, 'FCFA', 0, TRUE, 2),
  ('evolution', 'Pack Évolution', 'Idéal pour candidatures multiples et lettres de motivation', 250, 2500, 'FCFA', 25, TRUE, 3),
  ('carriere', 'Pack Carrière', 'Offre complète avec optimisation maximale et photo IA', 600, 5000, 'FCFA', 100, TRUE, 4),
  ('starter', 'Pack Starter', '500 AI Coins pour booster vos opportunités', 500, 5000, 'FCFA', 50, TRUE, 5),
  ('pro', 'Pack Pro', '1 500 AI Coins avec bonus généreux', 1500, 12000, 'FCFA', 200, TRUE, 6),
  ('business', 'Pack Business', '5 000 AI Coins pour candidats intensifs ou recruteurs', 5000, 30000, 'FCFA', 1000, TRUE, 7)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  credits = EXCLUDED.credits,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  bonus_credits = EXCLUDED.bonus_credits,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- -------------------------------------------------------------------------
-- 5. TABLE : credit_costs (Barème Centralisé & Dynamique des Fonctions IA)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cost INT NOT NULL CHECK (cost >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  category TEXT DEFAULT 'cv',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.credit_costs (feature_key, name, cost, is_active, category)
VALUES
  ('CV_GENERATION', 'Génération complète de CV IA', 20, TRUE, 'cv'),
  ('cv_complet', 'Génération / réécriture CV complet', 20, TRUE, 'cv'),
  ('CV_IMPROVEMENT', 'Amélioration intelligente de CV', 5, TRUE, 'cv'),
  ('EXPERIENCE_REWRITE', 'Réécriture d expérience professionnelle', 5, TRUE, 'cv'),
  ('COVER_LETTER', 'Génération de lettre de motivation', 10, TRUE, 'letter'),
  ('lettre_motivation', 'Lettre de motivation personnalisée', 10, TRUE, 'letter'),
  ('CV_TRANSLATION', 'Traduction professionnelle de CV', 10, TRUE, 'translation'),
  ('traduction_anglais', 'Traduction de CV en Anglais', 10, TRUE, 'translation'),
  ('CV_ANALYSIS', 'Analyse & Score ATS IA', 10, TRUE, 'analysis'),
  ('analyse_ats', 'Analyse & Score ATS', 10, TRUE, 'analysis'),
  ('AI_PHOTO', 'Photo professionnelle studio IA', 50, TRUE, 'photo'),
  ('photo_ia', 'Génération photo professionnelle', 50, TRUE, 'photo'),
  ('export_pdf', 'Export PDF standard', 0, TRUE, 'export'),
  ('export_docx', 'Export Word DOCX standard', 0, TRUE, 'export')
ON CONFLICT (feature_key) DO UPDATE SET
  name = EXCLUDED.name,
  cost = EXCLUDED.cost,
  is_active = EXCLUDED.is_active,
  category = EXCLUDED.category,
  updated_at = NOW();

-- -------------------------------------------------------------------------
-- 6. TABLE : ai_usage (Journal d Observabilité & Rentabilité LLM)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation_id TEXT NOT NULL,
  feature TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  estimated_provider_cost NUMERIC(10, 6) DEFAULT 0,
  credits_used INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user 
  ON public.ai_usage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_operation 
  ON public.ai_usage (operation_id);

-- =========================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- =========================================================================

ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- 1. credit_wallets : lecture propriétaire stricte, aucune modification directe client
DROP POLICY IF EXISTS "Lecture wallet propriétaire" ON public.credit_wallets;
CREATE POLICY "Lecture wallet propriétaire"
  ON public.credit_wallets FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 2. credit_transactions : lecture propriétaire stricte, écriture client interdite
DROP POLICY IF EXISTS "Lecture transactions propriétaire" ON public.credit_transactions;
CREATE POLICY "Lecture transactions propriétaire"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 3. credit_reservations : lecture propriétaire stricte
DROP POLICY IF EXISTS "Lecture reservations propriétaire" ON public.credit_reservations;
CREATE POLICY "Lecture reservations propriétaire"
  ON public.credit_reservations FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 4. credit_packages : lecture publique des packs actifs
DROP POLICY IF EXISTS "Lecture publique packages" ON public.credit_packages;
CREATE POLICY "Lecture publique packages"
  ON public.credit_packages FOR SELECT
  USING (is_active = TRUE OR auth.role() = 'service_role');

-- 5. credit_costs : lecture publique du barème
DROP POLICY IF EXISTS "Lecture publique couts" ON public.credit_costs;
CREATE POLICY "Lecture publique couts"
  ON public.credit_costs FOR SELECT
  USING (TRUE);

-- 6. ai_usage : lecture propriétaire
DROP POLICY IF EXISTS "Lecture usage propriétaire" ON public.ai_usage;
CREATE POLICY "Lecture usage propriétaire"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- =========================================================================
-- FONCTIONS POSTGRESQL ATOMIQUES & VERROUILLAGE SÉCURISÉ (SECURITY DEFINER)
-- =========================================================================

-- 1. get_or_create_wallet
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.credit_wallets (user_id, available_credits, reserved_credits)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING * INTO v_wallet;
  END IF;

  RETURN jsonb_build_object(
    'id', v_wallet.id,
    'user_id', v_wallet.user_id,
    'available_credits', v_wallet.available_credits,
    'reserved_credits', v_wallet.reserved_credits,
    'lifetime_earned', v_wallet.lifetime_earned,
    'lifetime_purchased', v_wallet.lifetime_purchased,
    'lifetime_consumed', v_wallet.lifetime_consumed,
    'created_at', v_wallet.created_at,
    'updated_at', v_wallet.updated_at
  );
END;
$$;

-- 2. reserve_credits (Phase 1: Réservation Atomique avec Verrouillage FOR UPDATE)
CREATE OR REPLACE FUNCTION public.reserve_credits(
  p_user_id UUID,
  p_operation_id TEXT,
  p_operation_type TEXT,
  p_amount INT,
  p_ttl_minutes INT DEFAULT 10,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_res RECORD;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT', 'message', 'Le montant à réserver doit être supérieur à 0.');
  END IF;

  -- Contrôle d idempotence
  SELECT * INTO v_res FROM public.credit_reservations WHERE operation_id = p_operation_id;
  IF FOUND THEN
    IF v_res.status IN ('reserved', 'processing') THEN
      SELECT * INTO v_wallet FROM public.credit_wallets WHERE id = v_res.wallet_id;
      RETURN jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'reservation_id', v_res.id,
        'operation_id', v_res.operation_id,
        'amount', v_res.amount,
        'status', v_res.status,
        'available_credits', v_wallet.available_credits,
        'reserved_credits', v_wallet.reserved_credits
      );
    ELSIF v_res.status = 'completed' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'ALREADY_COMPLETED', 'message', 'Cette opération a déjà été complétée et débitée.');
    ELSIF v_res.status = 'released' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'ALREADY_RELEASED', 'message', 'Cette réservation a déjà été libérée.');
    END IF;
  END IF;

  -- Verrouillage FOR UPDATE du wallet
  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.credit_wallets (user_id, available_credits, reserved_credits)
    VALUES (p_user_id, 0, 0)
    RETURNING * INTO v_wallet;
  END IF;

  IF v_wallet.available_credits < p_amount THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'INSUFFICIENT_CREDITS',
      'available_credits', v_wallet.available_credits,
      'required_credits', p_amount,
      'missing_credits', (p_amount - v_wallet.available_credits)
    );
  END IF;

  v_expires_at := NOW() + (GREATEST(1, p_ttl_minutes) || ' minutes')::INTERVAL;

  -- Déplacement des crédits vers les crédits réservés
  UPDATE public.credit_wallets
  SET
    available_credits = available_credits - p_amount,
    reserved_credits = reserved_credits + p_amount,
    updated_at = NOW()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.credit_reservations (
    user_id,
    wallet_id,
    amount,
    operation_id,
    operation_type,
    status,
    expires_at,
    metadata
  ) VALUES (
    p_user_id,
    v_wallet.id,
    p_amount,
    p_operation_id,
    p_operation_type,
    'reserved',
    v_expires_at,
    p_metadata
  ) RETURNING * INTO v_res;

  RETURN jsonb_build_object(
    'ok', true,
    'reservation_id', v_res.id,
    'operation_id', v_res.operation_id,
    'amount', v_res.amount,
    'available_credits', v_wallet.available_credits,
    'reserved_credits', v_wallet.reserved_credits,
    'expires_at', v_res.expires_at
  );
END;
$$;

-- 3. complete_credit_reservation (Phase 2 Succès : Consommation Définitive & Inscription au Ledger)
CREATE OR REPLACE FUNCTION public.complete_credit_reservation(
  p_operation_id TEXT,
  p_feature TEXT DEFAULT 'ia_operation',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_provider TEXT DEFAULT 'google',
  p_model TEXT DEFAULT 'gemini-1.5-flash',
  p_tokens_in INT DEFAULT 0,
  p_tokens_out INT DEFAULT 0,
  p_cost NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res RECORD;
  v_wallet RECORD;
  v_tx RECORD;
BEGIN
  SELECT * INTO v_res FROM public.credit_reservations WHERE operation_id = p_operation_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'RESERVATION_NOT_FOUND', 'message', 'Réservation introuvable.');
  END IF;

  IF v_res.status = 'completed' THEN
    SELECT * INTO v_wallet FROM public.credit_wallets WHERE id = v_res.wallet_id;
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'operation_id', p_operation_id,
      'consumed_credits', v_res.amount,
      'available_credits', v_wallet.available_credits,
      'reserved_credits', v_wallet.reserved_credits
    );
  END IF;

  IF v_res.status NOT IN ('reserved', 'processing') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_STATUS', 'message', 'Statut invalide pour complétion: ' || v_res.status);
  END IF;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE id = v_res.wallet_id FOR UPDATE;

  -- Déduction définitive des réservés
  UPDATE public.credit_wallets
  SET
    reserved_credits = GREATEST(0, reserved_credits - v_res.amount),
    lifetime_consumed = lifetime_consumed + v_res.amount,
    updated_at = NOW()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  -- Mise à jour statut réservation
  UPDATE public.credit_reservations
  SET
    status = 'completed',
    completed_at = NOW(),
    metadata = metadata || p_metadata
  WHERE id = v_res.id;

  -- Inscription au Ledger immuable
  INSERT INTO public.credit_transactions (
    user_id,
    wallet_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    reference,
    operation_id,
    metadata
  ) VALUES (
    v_res.user_id,
    v_wallet.id,
    'usage',
    -v_res.amount,
    v_wallet.available_credits + v_res.amount,
    v_wallet.available_credits,
    'Consommation AI Coins : ' || p_feature,
    'USAGE_' || p_operation_id,
    p_operation_id,
    p_metadata || jsonb_build_object('feature', p_feature, 'reservation_id', v_res.id)
  ) RETURNING * INTO v_tx;

  -- Journalisation Observabilité IA
  INSERT INTO public.ai_usage (
    user_id,
    operation_id,
    feature,
    provider,
    model,
    input_tokens,
    output_tokens,
    estimated_provider_cost,
    credits_used
  ) VALUES (
    v_res.user_id,
    p_operation_id,
    p_feature,
    p_provider,
    p_model,
    p_tokens_in,
    p_tokens_out,
    p_cost,
    v_res.amount
  );

  RETURN jsonb_build_object(
    'ok', true,
    'operation_id', p_operation_id,
    'consumed_credits', v_res.amount,
    'available_credits', v_wallet.available_credits,
    'reserved_credits', v_wallet.reserved_credits,
    'transaction_id', v_tx.id
  );
END;
$$;

-- 4. release_credit_reservation (Phase 2 Échec : Libération et Restitution Intégrale)
CREATE OR REPLACE FUNCTION public.release_credit_reservation(
  p_operation_id TEXT,
  p_reason TEXT DEFAULT 'AI_OPERATION_FAILED'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res RECORD;
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_res FROM public.credit_reservations WHERE operation_id = p_operation_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'RESERVATION_NOT_FOUND', 'message', 'Réservation introuvable.');
  END IF;

  IF v_res.status = 'released' THEN
    SELECT * INTO v_wallet FROM public.credit_wallets WHERE id = v_res.wallet_id;
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'operation_id', p_operation_id,
      'released_credits', v_res.amount,
      'available_credits', v_wallet.available_credits,
      'reserved_credits', v_wallet.reserved_credits
    );
  END IF;

  IF v_res.status = 'completed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CANNOT_RELEASE_COMPLETED', 'message', 'Impossible de libérer une réservation déjà consommée.');
  END IF;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE id = v_res.wallet_id FOR UPDATE;

  -- Restitution des crédits réservés dans le solde disponible
  UPDATE public.credit_wallets
  SET
    available_credits = available_credits + v_res.amount,
    reserved_credits = GREATEST(0, reserved_credits - v_res.amount),
    updated_at = NOW()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  UPDATE public.credit_reservations
  SET
    status = 'released',
    released_at = NOW(),
    metadata = metadata || jsonb_build_object('release_reason', p_reason)
  WHERE id = v_res.id;

  RETURN jsonb_build_object(
    'ok', true,
    'operation_id', p_operation_id,
    'released_credits', v_res.amount,
    'available_credits', v_wallet.available_credits,
    'reserved_credits', v_wallet.reserved_credits,
    'reason', p_reason
  );
END;
$$;

-- 5. credit_wallet_purchase (Achat de Pack ou Paiement Validé avec Bonus Séparé)
CREATE OR REPLACE FUNCTION public.credit_wallet_purchase(
  p_user_id UUID,
  p_credits INT,
  p_bonus INT DEFAULT 0,
  p_reference TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'Achat AI Coins',
  p_package_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT;
  v_bonus_ref TEXT;
  v_wallet RECORD;
  v_bal_before INT;
  v_bal_after INT;
  v_tx_id UUID;
  v_bonus_tx_id UUID;
BEGIN
  IF p_credits <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_CREDITS', 'message', 'Le nombre de crédits doit être positif.');
  END IF;

  v_ref := COALESCE(p_reference, 'PURCHASE_' || gen_random_uuid()::TEXT);
  v_bonus_ref := v_ref || '_BONUS';

  -- Contrôle d idempotence sur la référence d achat
  IF EXISTS (SELECT 1 FROM public.credit_transactions WHERE reference = v_ref) THEN
    SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'message', 'Cette transaction a déjà été traitée.',
      'available_credits', v_wallet.available_credits,
      'reserved_credits', v_wallet.reserved_credits
    );
  END IF;

  -- Verrouillage ou création du wallet
  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.credit_wallets (user_id, available_credits, reserved_credits)
    VALUES (p_user_id, 0, 0)
    RETURNING * INTO v_wallet;
  END IF;

  v_bal_before := v_wallet.available_credits;
  v_bal_after := v_bal_before + p_credits;

  -- 1. Crédit des AI Coins achetés
  UPDATE public.credit_wallets
  SET
    available_credits = v_bal_after,
    lifetime_purchased = lifetime_purchased + p_credits,
    updated_at = NOW()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.credit_transactions (
    user_id,
    wallet_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    reference,
    metadata
  ) VALUES (
    p_user_id,
    v_wallet.id,
    'purchase',
    p_credits,
    v_bal_before,
    v_bal_after,
    p_description,
    v_ref,
    p_metadata || jsonb_build_object('package_id', p_package_id)
  ) RETURNING id INTO v_tx_id;

  -- 2. Crédit distinct du Bonus promotionnel (si présent)
  IF p_bonus > 0 THEN
    v_bal_before := v_wallet.available_credits;
    v_bal_after := v_bal_before + p_bonus;

    UPDATE public.credit_wallets
    SET
      available_credits = v_bal_after,
      lifetime_earned = lifetime_earned + p_bonus,
      updated_at = NOW()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;

    INSERT INTO public.credit_transactions (
      user_id,
      wallet_id,
      type,
      amount,
      balance_before,
      balance_after,
      description,
      reference,
      metadata
    ) VALUES (
      p_user_id,
      v_wallet.id,
      'promotion',
      p_bonus,
      v_bal_before,
      v_bal_after,
      'Bonus additionnel sur pack',
      v_bonus_ref,
      p_metadata || jsonb_build_object('parent_reference', v_ref)
    ) RETURNING id INTO v_bonus_tx_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'credits_added', p_credits,
    'bonus_added', p_bonus,
    'total_added', (p_credits + p_bonus),
    'available_credits', v_wallet.available_credits,
    'reserved_credits', v_wallet.reserved_credits,
    'transaction_id', v_tx_id,
    'bonus_transaction_id', v_bonus_tx_id
  );
END;
$$;

-- 6. grant_signup_bonus (Bonus d Inscription Idempotent)
CREATE OR REPLACE FUNCTION public.grant_signup_bonus(
  p_user_id UUID,
  p_amount INT DEFAULT 50,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT;
  v_wallet RECORD;
  v_bal_before INT;
  v_bal_after INT;
  v_tx_id UUID;
BEGIN
  v_ref := 'SIGNUP_BONUS_' || p_user_id::TEXT;

  -- Contrôle d idempotence strict
  IF EXISTS (
    SELECT 1 FROM public.credit_transactions 
    WHERE user_id = p_user_id AND type = 'signup_bonus'
  ) OR EXISTS (
    SELECT 1 FROM public.credit_transactions WHERE reference = v_ref
  ) THEN
    SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'ok', true,
      'already_granted', true,
      'message', 'Le bonus de bienvenue a déjà été attribué pour ce compte.',
      'available_credits', COALESCE(v_wallet.available_credits, 0)
    );
  END IF;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.credit_wallets (user_id, available_credits, reserved_credits)
    VALUES (p_user_id, 0, 0)
    RETURNING * INTO v_wallet;
  END IF;

  v_bal_before := v_wallet.available_credits;
  v_bal_after := v_bal_before + p_amount;

  UPDATE public.credit_wallets
  SET
    available_credits = v_bal_after,
    lifetime_earned = lifetime_earned + p_amount,
    updated_at = NOW()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.credit_transactions (
    user_id,
    wallet_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    reference,
    metadata
  ) VALUES (
    p_user_id,
    v_wallet.id,
    'signup_bonus',
    p_amount,
    v_bal_before,
    v_bal_after,
    'Bonus de bienvenue inscription (AI Coins)',
    v_ref,
    jsonb_build_object('email', p_email)
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'ok', true,
    'granted', p_amount,
    'available_credits', v_wallet.available_credits,
    'transaction_id', v_tx_id
  );
END;
$$;

-- 7. admin_adjust_credits (Ajustement Administrateur avec Motif Obligatoire)
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  p_admin_id UUID,
  p_user_id UUID,
  p_amount INT,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_bal_before INT;
  v_bal_after INT;
  v_tx_id UUID;
  v_ref TEXT;
BEGIN
  IF p_amount = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ZERO_AMOUNT', 'message', 'Le montant de l ajustement ne peut pas être 0.');
  END IF;

  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'REASON_REQUIRED', 'message', 'Un motif d ajustement administratif est obligatoire.');
  END IF;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.credit_wallets (user_id, available_credits, reserved_credits)
    VALUES (p_user_id, 0, 0)
    RETURNING * INTO v_wallet;
  END IF;

  v_bal_before := v_wallet.available_credits;
  v_bal_after := v_bal_before + p_amount;

  IF v_bal_after < 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'INSUFFICIENT_FUNDS',
      'message', 'L ajustement entraînerait un solde négatif.',
      'available_credits', v_bal_before,
      'attempted_delta', p_amount
    );
  END IF;

  UPDATE public.credit_wallets
  SET
    available_credits = v_bal_after,
    lifetime_earned = CASE WHEN p_amount > 0 THEN lifetime_earned + p_amount ELSE lifetime_earned END,
    lifetime_consumed = CASE WHEN p_amount < 0 THEN lifetime_consumed + ABS(p_amount) ELSE lifetime_consumed END,
    updated_at = NOW()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  v_ref := 'ADMIN_ADJ_' || gen_random_uuid()::TEXT;

  INSERT INTO public.credit_transactions (
    user_id,
    wallet_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    reference,
    metadata
  ) VALUES (
    p_user_id,
    v_wallet.id,
    'admin_adjustment',
    p_amount,
    v_bal_before,
    v_bal_after,
    'Ajustement administrateur : ' || TRIM(p_reason),
    v_ref,
    p_metadata || jsonb_build_object('admin_id', p_admin_id, 'reason', p_reason)
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'ok', true,
    'adjustment', p_amount,
    'available_credits', v_wallet.available_credits,
    'transaction_id', v_tx_id,
    'reference', v_ref
  );
END;
$$;

-- 8. cleanup_expired_reservations (Nettoyage automatique des réservations orphelines/expirées)
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations(p_older_than_minutes INT DEFAULT 15)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res RECORD;
  v_count INT := 0;
BEGIN
  FOR v_res IN
    SELECT * FROM public.credit_reservations
    WHERE status IN ('reserved', 'processing')
      AND expires_at < NOW()
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public.release_credit_reservation(v_res.operation_id, 'RESERVATION_TIMEOUT_EXPIRED');
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- =========================================================================
-- MIGRATION INITIALE : SYNCHRONISATION DES COMPTES EXISTANTS VERS credit_wallets
-- =========================================================================

DO $$
DECLARE
  v_user RECORD;
  v_legacy_credits INT;
  v_wallet_id UUID;
BEGIN
  -- Vérifier s'il y a des profils existants à migrer vers credit_wallets
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    FOR v_user IN SELECT id FROM public.profiles LOOP
      -- Calculer le solde legacy de l'utilisateur
      v_legacy_credits := 0;
      
      -- 1. Regarder dans profiles.credits
      SELECT COALESCE(credits, 0) INTO v_legacy_credits FROM public.profiles WHERE id = v_user.id;
      
      -- Créer ou synchroniser le wallet
      INSERT INTO public.credit_wallets (user_id, available_credits, lifetime_earned)
      VALUES (v_user.id, GREATEST(v_legacy_credits, 30), GREATEST(v_legacy_credits, 30))
      ON CONFLICT (user_id) DO UPDATE SET
        available_credits = GREATEST(credit_wallets.available_credits, EXCLUDED.available_credits)
      RETURNING id INTO v_wallet_id;

      IF v_wallet_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.credit_transactions 
        WHERE user_id = v_user.id AND type = 'migration'
      ) THEN
        INSERT INTO public.credit_transactions (
          user_id,
          wallet_id,
          type,
          amount,
          balance_before,
          balance_after,
          description,
          reference
        ) VALUES (
          v_user.id,
          v_wallet_id,
          'migration',
          GREATEST(v_legacy_credits, 30),
          0,
          GREATEST(v_legacy_credits, 30),
          'Initialisation solde AI Coins',
          'MIGRATION_' || v_user.id::TEXT
        ) ON CONFLICT (reference) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- TRIGGER AUTOMATIQUE : Attribution du Bonus d'Inscription
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_grant_signup_bonus_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.grant_signup_bonus(NEW.id, 50, NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_signup_bonus ON public.profiles;
CREATE TRIGGER trg_grant_signup_bonus
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_grant_signup_bonus_fn();
