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
