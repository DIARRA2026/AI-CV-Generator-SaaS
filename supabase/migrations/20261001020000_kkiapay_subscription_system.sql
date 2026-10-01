-- =========================================================================
-- MIGRATION : SYSTÈME D'ABONNEMENT ET PAIEMENT SÉCURISÉ KKIAPAY
-- MonCV.ai — INNOVA GROUP
-- Date : 2026-10-01
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. TABLE : plans (Source de vérité des prix et formules)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  price_xof      INT NOT NULL CHECK (price_xof >= 0),
  duration_days  INT NOT NULL DEFAULT 30,
  credits        INT NOT NULL DEFAULT 0,
  features       JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion / mise à jour des trois formules officielles
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

-- Alias de compatibilité avec anciens slugs
INSERT INTO public.plans (id, name, price_xof, duration_days, credits, features, is_active) VALUES
  ('evolution', 'Pro', 2500, 30, 250, '["Alias compatible Pro (2500 FCFA)"]'::jsonb, FALSE),
  ('carriere', 'VIP & Portfolio', 5000, 30, 600, '["Alias compatible VIP (5000 FCFA)"]'::jsonb, FALSE)
ON CONFLICT (id) DO NOTHING;

-- RLS sur plans : Lecture pour tous, écriture service_role
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_select_all" ON public.plans;
CREATE POLICY "plans_select_all" ON public.plans FOR SELECT USING (TRUE);

-- -------------------------------------------------------------------------
-- 2. TABLE : orders (Intention d'achat créée côté serveur)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id     TEXT NOT NULL REFERENCES public.plans(id),
  amount_xof  INT NOT NULL CHECK (amount_xof > 0),
  currency    TEXT NOT NULL DEFAULT 'XOF',
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- RLS sur orders : Lecture uniquement par l'utilisateur propriétaire ou service_role
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Aucune policy INSERT / UPDATE / DELETE pour anon / authenticated : tout passe par service_role

-- -------------------------------------------------------------------------
-- 3. TABLE : payment_transactions (Transactions KKiaPay vérifiées)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL DEFAULT 'kkiapay',
  transaction_id  TEXT NOT NULL,
  amount          INT NOT NULL,
  fees            INT DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'XOF',
  status          TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'refunded')),
  payment_method  TEXT,
  environment     TEXT NOT NULL DEFAULT 'live' CHECK (environment IN ('sandbox', 'live')),
  raw_reference   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_payment_transactions_provider_tx UNIQUE (provider, transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_user ON public.payment_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_order ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_lookup ON public.payment_transactions(provider, transaction_id);

-- RLS sur payment_transactions : Lecture propriétaire / service_role
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_transactions_select_own" ON public.payment_transactions;
CREATE POLICY "payment_transactions_select_own" ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- -------------------------------------------------------------------------
-- 4. ADAPTATION DE LA TABLE subscriptions (Colonnes KKiaPay & Index unique actif)
-- -------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'plan_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN plan_id TEXT REFERENCES public.plans(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'payment_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN payment_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'started_at') THEN
    ALTER TABLE public.subscriptions ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Un seul abonnement actif par utilisateur (index partiel)
DROP INDEX IF EXISTS public.idx_subscriptions_single_active;
CREATE UNIQUE INDEX idx_subscriptions_single_active ON public.subscriptions (user_id) WHERE status = 'active';

-- RLS sur subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Aucune policy INSERT / UPDATE / DELETE pour anon / authenticated : tout passe par service_role

-- -------------------------------------------------------------------------
-- 5. TABLE : payment_events (Journalisation des webhooks KKiaPay)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  TEXT,
  event           TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at     TIMESTAMPTZ DEFAULT NOW(),
  result          TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_events_tx ON public.payment_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_date ON public.payment_events(received_at DESC);

-- RLS sur payment_events : Aucun accès anon/auth (service_role uniquement)
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events FORCE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 6. PROTECTION RENFORCÉE SUR profiles : INTERDICTION D'ALTÉRER plan_tier DIRECTEMENT
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_rights_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la modification ne provient pas du service_role (requête client directe de l'utilisateur)
  IF auth.role() <> 'service_role' THEN
    IF NEW.plan_tier IS DISTINCT FROM OLD.plan_tier THEN
      RAISE EXCEPTION 'Interdiction de modifier directement la colonne plan_tier depuis le client.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profile_rights ON public.profiles;
CREATE TRIGGER trg_protect_profile_rights
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_rights_fn();

-- -------------------------------------------------------------------------
-- 7. FONCTION SQL ATOMIQUE : confirm_kkiapay_payment()
-- -------------------------------------------------------------------------
-- Exécutée en une transaction atomique avec verrou FOR UPDATE sur la commande.
-- Garantit l'idempotence, l'application de la règle 30 jours et la recharge de crédits.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_kkiapay_payment(
  p_order_id        UUID,
  p_transaction_id  TEXT,
  p_amount          INT,
  p_fees            INT,
  p_payment_method  TEXT,
  p_environment     TEXT,
  p_raw_reference   JSONB
)
RETURNS TABLE (
  success          BOOLEAN,
  message          TEXT,
  subscription_id  UUID,
  expires_at       TIMESTAMPTZ,
  plan_id          TEXT,
  credits_added    INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_existing_tx RECORD;
  v_sub RECORD;
  v_tx_id UUID;
  v_sub_id UUID;
  v_new_expires_at TIMESTAMPTZ;
  v_started_at TIMESTAMPTZ;
  v_plan_credits INT := 0;
  v_user_email TEXT;
BEGIN
  -- 1. Verrouiller la commande pour éviter toute concurrence
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Commande introuvable'::TEXT, NULL::UUID, NULL::TIMESTAMPTZ, NULL::TEXT, 0;
    RETURN;
  END IF;

  -- 2. Vérification d'idempotence sur la transaction KKiaPay
  SELECT * INTO v_existing_tx FROM public.payment_transactions
    WHERE provider = 'kkiapay' AND transaction_id = p_transaction_id;

  IF FOUND AND v_existing_tx.status = 'success' THEN
    -- Récupérer l'abonnement actif existant
    SELECT id, subscriptions.expires_at INTO v_sub_id, v_new_expires_at
      FROM public.subscriptions
      WHERE user_id = v_order.user_id AND status = 'active'
      ORDER BY subscriptions.expires_at DESC LIMIT 1;

    RETURN QUERY SELECT TRUE, 'Transaction déjà confirmée (idempotent)'::TEXT, v_sub_id, v_new_expires_at, v_order.plan_id, 0;
    RETURN;
  END IF;

  -- 3. Enregistrer ou mettre à jour la transaction
  INSERT INTO public.payment_transactions (
    order_id,
    user_id,
    provider,
    transaction_id,
    amount,
    fees,
    currency,
    status,
    payment_method,
    environment,
    raw_reference
  ) VALUES (
    p_order_id,
    v_order.user_id,
    'kkiapay',
    p_transaction_id,
    p_amount,
    COALESCE(p_fees, 0),
    'XOF',
    'success',
    COALESCE(p_payment_method, 'kkiapay'),
    p_environment,
    COALESCE(p_raw_reference, '{}'::jsonb)
  )
  ON CONFLICT (provider, transaction_id) DO UPDATE SET
    status = 'success',
    amount = EXCLUDED.amount,
    fees = EXCLUDED.fees,
    payment_method = EXCLUDED.payment_method,
    raw_reference = EXCLUDED.raw_reference,
    updated_at = NOW()
  RETURNING id INTO v_tx_id;

  -- 4. Passer la commande au statut 'paid'
  UPDATE public.orders
    SET status = 'paid', updated_at = NOW()
    WHERE id = p_order_id;

  -- Récupérer l'email de l'utilisateur
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_order.user_id;

  -- 5. Calcul de l'abonnement 30 jours (Règles officielles de renouvellement)
  -- Rechercher un abonnement actif en cours
  SELECT * INTO v_sub FROM public.subscriptions
    WHERE user_id = v_order.user_id AND status = 'active' AND (subscriptions.expires_at IS NULL OR subscriptions.expires_at > NOW())
    FOR UPDATE;

  IF FOUND THEN
    IF v_sub.plan_id = v_order.plan_id OR v_sub.plan_tier = v_order.plan_id THEN
      -- Même formule renouvelée avant l'échéance : prolonger de 30 jours à partir de la date d'expiration actuelle
      v_started_at := COALESCE(v_sub.started_at, v_sub.activated_at, NOW());
      v_new_expires_at := v_sub.expires_at + INTERVAL '30 days';

      UPDATE public.subscriptions SET
        payment_id = v_tx_id,
        transaction_ref = p_transaction_id,
        amount = p_amount,
        expires_at = v_new_expires_at,
        activated_at = NOW()
      WHERE id = v_sub.id
      RETURNING id INTO v_sub_id;
    ELSE
      -- Changement de formule : l'ancienne est clôturée, la nouvelle démarre immédiatement pour 30 jours
      UPDATE public.subscriptions SET status = 'cancelled' WHERE id = v_sub.id;

      v_started_at := NOW();
      v_new_expires_at := NOW() + INTERVAL '30 days';

      INSERT INTO public.subscriptions (
        user_id,
        user_email,
        plan_tier,
        plan_id,
        payment_id,
        amount,
        currency,
        status,
        payment_method,
        transaction_ref,
        started_at,
        activated_at,
        expires_at
      ) VALUES (
        v_order.user_id,
        COALESCE(v_user_email, 'client@moncv.ai'),
        v_order.plan_id,
        v_order.plan_id,
        v_tx_id,
        p_amount,
        'FCFA',
        'active',
        COALESCE(p_payment_method, 'KKiaPay'),
        p_transaction_id,
        v_started_at,
        NOW(),
        v_new_expires_at
      ) RETURNING id INTO v_sub_id;
    END IF;
  ELSE
    -- Première souscription ou abonnement expiré : 30 jours à partir de la confirmation
    -- Clôturer d'éventuels abonnements expirés résiduels
    UPDATE public.subscriptions SET status = 'expired' WHERE user_id = v_order.user_id AND status = 'active';

    v_started_at := NOW();
    v_new_expires_at := NOW() + INTERVAL '30 days';

    INSERT INTO public.subscriptions (
      user_id,
      user_email,
      plan_tier,
      plan_id,
      payment_id,
      amount,
      currency,
      status,
      payment_method,
      transaction_ref,
      started_at,
      activated_at,
      expires_at
    ) VALUES (
      v_order.user_id,
      COALESCE(v_user_email, 'client@moncv.ai'),
      v_order.plan_id,
      v_order.plan_id,
      v_tx_id,
      p_amount,
      'FCFA',
      'active',
      COALESCE(p_payment_method, 'KKiaPay'),
      p_transaction_id,
      v_started_at,
      NOW(),
      v_new_expires_at
    ) RETURNING id INTO v_sub_id;
  END IF;

  -- 6. Synchroniser profiles.plan_tier
  UPDATE public.profiles
    SET plan_tier = v_order.plan_id, updated_at = NOW()
    WHERE id = v_order.user_id;

  -- 7. Option recommandée : Recharger les crédits correspondants au pack
  SELECT credits INTO v_plan_credits FROM public.plans WHERE id = v_order.plan_id;
  IF v_plan_credits IS NULL OR v_plan_credits <= 0 THEN
    IF v_order.plan_id = 'essentiel' THEN v_plan_credits := 120;
    ELSIF v_order.plan_id IN ('pro', 'evolution') THEN v_plan_credits := 250;
    ELSIF v_order.plan_id IN ('vip', 'carriere') THEN v_plan_credits := 600;
    END IF;
  END IF;

  IF v_plan_credits > 0 THEN
    PERFORM public.crediter_lot(
      v_order.user_id,
      'user',
      v_order.plan_id,
      v_plan_credits,
      1, -- validité 1 mois
      'achat',
      'KKIAPAY_' || p_transaction_id
    );
  END IF;

  -- 8. Facture OHADA
  BEGIN
    INSERT INTO public.invoices (
      numero,
      compte_id,
      compte_type,
      client_nom,
      client_email,
      pack_slug,
      pack_nom,
      credits,
      montant_fcfa
    ) VALUES (
      'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('public.invoice_number_seq')::TEXT, 5, '0'),
      v_order.user_id,
      'user',
      COALESCE(v_user_email, 'Client MonCV.ai'),
      v_user_email,
      v_order.plan_id,
      CASE v_order.plan_id WHEN 'essentiel' THEN 'Essentiel' WHEN 'pro' THEN 'Pro' ELSE 'VIP & Portfolio' END,
      COALESCE(v_plan_credits, 0),
      p_amount
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ne pas bloquer l'abonnement si la facture échoue
    NULL;
  END;

  RETURN QUERY SELECT TRUE, 'Abonnement activé avec succès'::TEXT, v_sub_id, v_new_expires_at, v_order.plan_id, COALESCE(v_plan_credits, 0);
END;
$$;

-- Restreindre strictement l'exécution de la fonction de confirmation au service_role
REVOKE ALL ON FUNCTION public.confirm_kkiapay_payment FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_kkiapay_payment TO service_role;
