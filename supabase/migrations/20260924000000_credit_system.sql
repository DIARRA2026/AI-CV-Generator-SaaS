-- =========================================================================
-- MIGRATION: SYSTÈME DE CRÉDITS PRÉPAYÉS & PAIEMENT WAVE SANS ABONNEMENT
-- MonCV.ai — Développé et Propulsé par INNOVA GROUP
-- Date: 2026-09-24
-- =========================================================================

-- 1. TABLE DES PACKS DE CRÉDITS
CREATE TABLE IF NOT EXISTS public.credit_packs (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  price_fcfa INT NOT NULL DEFAULT 0,
  credits INT NOT NULL,
  validity_days INT, -- NULL = permanent
  wave_link TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion / Initialisation des 4 packs officiels
INSERT INTO public.credit_packs (code, label, price_fcfa, credits, validity_days, wave_link, active)
VALUES
  ('decouverte', 'Découverte', 0, 20, NULL, NULL, TRUE),
  ('essentiel', 'Essentiel', 1500, 60, 30, 'https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=1500', TRUE),
  ('evolution', 'Évolution', 2500, 125, 90, 'https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=2500', TRUE),
  ('carriere', 'Carrière', 5000, 300, 180, 'https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=5000', TRUE)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  price_fcfa = EXCLUDED.price_fcfa,
  credits = EXCLUDED.credits,
  validity_days = EXCLUDED.validity_days,
  wave_link = EXCLUDED.wave_link,
  active = EXCLUDED.active;

-- 2. TABLE DES LOTS DE CRÉDITS UTILISATEURS (FIFO par date d'expiration)
CREATE TABLE IF NOT EXISTS public.credit_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_initial INT NOT NULL CHECK (credits_initial > 0),
  credits_remaining INT NOT NULL CHECK (credits_remaining >= 0),
  source TEXT NOT NULL CHECK (source IN ('offert', 'achat', 'migration', 'bonus')),
  pack_code TEXT REFERENCES public.credit_packs(code) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL si permanent
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_batches_user_active 
  ON public.credit_batches (user_id, expires_at) 
  WHERE credits_remaining > 0;

-- 3. GRAND LIVRE COMPTABLE DES CRÉDITS (Audit trail immuable)
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.credit_batches(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  delta INT NOT NULL, -- Positif (crédit) ou Négatif (débit)
  balance_after INT NOT NULL CHECK (balance_after >= 0),
  ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user 
  ON public.credit_ledger (user_id, created_at DESC);

-- 4. TABLE DES DEMANDES DE VALIDATION DE PAIEMENT WAVE
CREATE TABLE IF NOT EXISTS public.payment_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  pack_code TEXT NOT NULL REFERENCES public.credit_packs(code),
  amount_fcfa INT NOT NULL,
  wave_reference TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_claims_status 
  ON public.payment_claims (status, created_at DESC);

-- =========================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- =========================================================================

ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_claims ENABLE ROW LEVEL SECURITY;

-- Politiques credit_packs : lecture publique de tous les packs actifs
DROP POLICY IF EXISTS "Lecture publique packs de crédits" ON public.credit_packs;
CREATE POLICY "Lecture publique packs de crédits"
  ON public.credit_packs FOR SELECT
  USING (active = TRUE OR auth.role() = 'service_role');

-- Politiques credit_batches : lecture propriétaire stricte, écriture par service_role / fonctions SECURITY DEFINER uniquement
DROP POLICY IF EXISTS "Lecture lots de crédits propriétaire" ON public.credit_batches;
CREATE POLICY "Lecture lots de crédits propriétaire"
  ON public.credit_batches FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques credit_ledger : lecture propriétaire stricte, écriture par fonctions SECURITY DEFINER uniquement
DROP POLICY IF EXISTS "Lecture grand livre propriétaire" ON public.credit_ledger;
CREATE POLICY "Lecture grand livre propriétaire"
  ON public.credit_ledger FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Politiques payment_claims : lecture et soumission propriétaire, validation admin uniquement
DROP POLICY IF EXISTS "Lecture réclamations propriétaire" ON public.payment_claims;
CREATE POLICY "Lecture réclamations propriétaire"
  ON public.payment_claims FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Création réclamation propriétaire" ON public.payment_claims;
CREATE POLICY "Création réclamation propriétaire"
  ON public.payment_claims FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id AND status = 'pending')
    OR auth.role() = 'service_role'
  );

-- =========================================================================
-- FONCTIONS POSTGRESQL ATOMIQUES & SÉCURISÉES (SECURITY DEFINER)
-- =========================================================================

-- 1. Consultation du solde disponible et de la prochaine date d'expiration
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(p_user_id UUID)
RETURNS TABLE (
  balance INT,
  nearest_expiry TIMESTAMPTZ,
  active_batches INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(b.credits_remaining), 0)::INT AS balance,
    MIN(b.expires_at) FILTER (WHERE b.expires_at IS NOT NULL) AS nearest_expiry,
    COUNT(b.id)::INT AS active_batches
  FROM public.credit_batches b
  WHERE b.user_id = p_user_id
    AND b.credits_remaining > 0
    AND (b.expires_at IS NULL OR b.expires_at > NOW());
END;
$$;

-- 2. Attribution idempotente des 20 crédits de bienvenue
CREATE OR REPLACE FUNCTION public.grant_welcome_credits(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_received BOOLEAN;
  v_batch_id UUID;
  v_balance INT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.credit_ledger 
    WHERE user_id = p_user_id AND action = 'welcome_gift'
  ) INTO v_already_received;

  IF v_already_received THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.credit_batches (
    user_id,
    credits_initial,
    credits_remaining,
    source,
    pack_code,
    purchased_at,
    expires_at
  ) VALUES (
    p_user_id,
    20,
    20,
    'offert',
    'decouverte',
    NOW(),
    NULL
  ) RETURNING id INTO v_batch_id;

  SELECT COALESCE(SUM(credits_remaining), 0)::INT INTO v_balance
  FROM public.credit_batches
  WHERE user_id = p_user_id
    AND credits_remaining > 0
    AND (expires_at IS NULL OR expires_at > NOW());

  INSERT INTO public.credit_ledger (
    user_id,
    batch_id,
    action,
    delta,
    balance_after,
    ref
  ) VALUES (
    p_user_id,
    v_batch_id,
    'welcome_gift',
    20,
    v_balance,
    'CREDIT_BIENVENUE_20'
  );

  RETURN TRUE;
END;
$$;

-- 3. Débit atomique FIFO par date d'expiration la plus proche
CREATE OR REPLACE FUNCTION public.consume_user_credits(
  p_user_id UUID,
  p_amount INT,
  p_action TEXT,
  p_ref TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_available INT;
  v_remaining_to_deduct INT;
  v_batch RECORD;
  v_deduct_from_batch INT;
  v_new_balance INT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant de crédits à déduire doit être supérieur à 0 (reçu: %)', p_amount;
  END IF;

  -- Verrouillage des lots actifs avec FOR UPDATE pour prévenir toute condition de concurrence
  SELECT COALESCE(SUM(credits_remaining), 0)::INT INTO v_total_available
  FROM public.credit_batches
  WHERE user_id = p_user_id
    AND credits_remaining > 0
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_total_available < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS: Solde insuffisant (% disponible, % requis)', v_total_available, p_amount;
  END IF;

  v_remaining_to_deduct := p_amount;

  FOR v_batch IN
    SELECT id, credits_remaining, expires_at
    FROM public.credit_batches
    WHERE user_id = p_user_id
      AND credits_remaining > 0
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY 
      CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END, 
      expires_at ASC, 
      purchased_at ASC
    FOR UPDATE
  LOOP
    IF v_remaining_to_deduct <= 0 THEN
      EXIT;
    END IF;

    v_deduct_from_batch := LEAST(v_batch.credits_remaining, v_remaining_to_deduct);

    UPDATE public.credit_batches
    SET credits_remaining = credits_remaining - v_deduct_from_batch
    WHERE id = v_batch.id;

    v_remaining_to_deduct := v_remaining_to_deduct - v_deduct_from_batch;
  END LOOP;

  SELECT COALESCE(SUM(credits_remaining), 0)::INT INTO v_new_balance
  FROM public.credit_batches
  WHERE user_id = p_user_id
    AND credits_remaining > 0
    AND (expires_at IS NULL OR expires_at > NOW());

  INSERT INTO public.credit_ledger (
    user_id,
    batch_id,
    action,
    delta,
    balance_after,
    ref
  ) VALUES (
    p_user_id,
    NULL,
    p_action,
    -p_amount,
    v_new_balance,
    p_ref
  );

  RETURN v_new_balance;
END;
$$;

-- 4. Remboursement sécurisé de crédits
CREATE OR REPLACE FUNCTION public.refund_user_credits(
  p_user_id UUID,
  p_amount INT,
  p_action TEXT DEFAULT 'refund',
  p_ref TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID;
  v_new_balance INT;
BEGIN
  IF p_amount <= 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.credit_batches (
    user_id,
    credits_initial,
    credits_remaining,
    source,
    pack_code,
    purchased_at,
    expires_at
  ) VALUES (
    p_user_id,
    p_amount,
    p_amount,
    'bonus',
    NULL,
    NOW(),
    NOW() + INTERVAL '90 days'
  ) RETURNING id INTO v_batch_id;

  SELECT COALESCE(SUM(credits_remaining), 0)::INT INTO v_new_balance
  FROM public.credit_batches
  WHERE user_id = p_user_id
    AND credits_remaining > 0
    AND (expires_at IS NULL OR expires_at > NOW());

  INSERT INTO public.credit_ledger (
    user_id,
    batch_id,
    action,
    delta,
    balance_after,
    ref
  ) VALUES (
    p_user_id,
    v_batch_id,
    COALESCE(p_action, 'refund'),
    p_amount,
    v_new_balance,
    p_ref
  );

  RETURN v_new_balance;
END;
$$;

-- 5. Approbation administrative d'une réclamation Wave
CREATE OR REPLACE FUNCTION public.approve_payment_claim(
  p_claim_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim RECORD;
  v_pack RECORD;
  v_batch_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_new_balance INT;
BEGIN
  SELECT * INTO v_claim
  FROM public.payment_claims
  WHERE id = p_claim_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Demande de paiement introuvable');
  END IF;

  IF v_claim.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cette demande a déjà été traitée (statut: ' || v_claim.status || ')');
  END IF;

  SELECT * INTO v_pack
  FROM public.credit_packs
  WHERE code = v_claim.pack_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pack de crédits inconnu');
  END IF;

  IF v_pack.validity_days IS NOT NULL AND v_pack.validity_days > 0 THEN
    v_expires_at := NOW() + (v_pack.validity_days || ' days')::INTERVAL;
  ELSE
    v_expires_at := NULL;
  END IF;

  INSERT INTO public.credit_batches (
    user_id,
    credits_initial,
    credits_remaining,
    source,
    pack_code,
    purchased_at,
    expires_at
  ) VALUES (
    v_claim.user_id,
    v_pack.credits,
    v_pack.credits,
    'achat',
    v_pack.code,
    NOW(),
    v_expires_at
  ) RETURNING id INTO v_batch_id;

  SELECT COALESCE(SUM(credits_remaining), 0)::INT INTO v_new_balance
  FROM public.credit_batches
  WHERE user_id = v_claim.user_id
    AND credits_remaining > 0
    AND (expires_at IS NULL OR expires_at > NOW());

  INSERT INTO public.credit_ledger (
    user_id,
    batch_id,
    action,
    delta,
    balance_after,
    ref
  ) VALUES (
    v_claim.user_id,
    v_batch_id,
    'purchase',
    v_pack.credits,
    v_new_balance,
    'WAVE_' || v_claim.wave_reference
  );

  UPDATE public.payment_claims
  SET
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW()
  WHERE id = p_claim_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Paiement Wave validé. ' || v_pack.credits || ' crédits ajoutés avec succès.',
    'credits_added', v_pack.credits,
    'new_balance', v_new_balance
  );
END;
$$;

-- 6. Rejet administratif d'une réclamation Wave
CREATE OR REPLACE FUNCTION public.reject_payment_claim(
  p_claim_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Référence introuvable ou montant incorrect'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.payment_claims
  SET
    status = 'rejected',
    rejection_reason = COALESCE(p_reason, 'Référence de transaction introuvable'),
    reviewed_by = p_admin_id,
    reviewed_at = NOW()
  WHERE id = p_claim_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Demande introuvable ou déjà traitée');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Demande de paiement rejetée.');
END;
$$;

-- =========================================================================
-- DÉCLENCHEURS AUTOMATIQUES (TRIGGERS)
-- =========================================================================

-- Créditer automatiquement 20 crédits de bienvenue dès la création d'un profil
CREATE OR REPLACE FUNCTION public.trg_grant_welcome_credits_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.grant_welcome_credits(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_welcome_credits ON public.profiles;
CREATE TRIGGER trg_grant_welcome_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_grant_welcome_credits_fn();

-- =========================================================================
-- MIGRATION DES COMPTES & PLANS EXISTANTS
-- =========================================================================

DO $$
DECLARE
  v_prof RECORD;
  v_credits INT;
  v_days INT;
  v_batch_id UUID;
  v_bal INT;
BEGIN
  FOR v_prof IN SELECT id, plan_tier FROM public.profiles LOOP
    -- 1. Attribuer les 20 crédits de bienvenue si non reçus
    PERFORM public.grant_welcome_credits(v_prof.id);

    -- 2. Convertir les anciens abonnements en lots de crédits équivalents
    v_credits := 0;
    v_days := 0;

    IF v_prof.plan_tier = '1500' THEN
      v_credits := 60;
      v_days := 30;
    ELSIF v_prof.plan_tier = '2500' THEN
      v_credits := 125;
      v_days := 90;
    ELSIF v_prof.plan_tier = '5000' OR v_prof.plan_tier IN ('enterprise30', 'enterprise75', 'enterprise200', 'cyber15') THEN
      v_credits := 300;
      v_days := 180;
    END IF;

    IF v_credits > 0 THEN
      INSERT INTO public.credit_batches (
        user_id,
        credits_initial,
        credits_remaining,
        source,
        pack_code,
        purchased_at,
        expires_at
      ) VALUES (
        v_prof.id,
        v_credits,
        v_credits,
        'migration',
        CASE WHEN v_credits = 60 THEN 'essentiel' WHEN v_credits = 125 THEN 'evolution' ELSE 'carriere' END,
        NOW(),
        NOW() + (v_days || ' days')::INTERVAL
      ) RETURNING id INTO v_batch_id;

      SELECT COALESCE(SUM(credits_remaining), 0)::INT INTO v_bal
      FROM public.credit_batches
      WHERE user_id = v_prof.id
        AND credits_remaining > 0
        AND (expires_at IS NULL OR expires_at > NOW());

      INSERT INTO public.credit_ledger (
        user_id,
        batch_id,
        action,
        delta,
        balance_after,
        ref
      ) VALUES (
        v_prof.id,
        v_batch_id,
        'migration',
        v_credits,
        v_bal,
        'MIGRATION_PLAN_' || COALESCE(v_prof.plan_tier, 'legacy')
      );
    END IF;
  END LOOP;
END;
$$;
