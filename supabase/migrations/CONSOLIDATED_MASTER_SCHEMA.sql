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
