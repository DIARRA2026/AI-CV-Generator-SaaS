-- =========================================================================
-- MIGRATION LOT 3 : FACTURES NORMALISÉES OHADA & SÉQUENCE POSTGRES
-- MonCV.ai — INNOVA GROUP
-- Date : 2026-09-24
-- =========================================================================

-- 1. Séquence Postgres sans trou pour la numérotation officielle OHADA
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1001;

-- 2. Table des factures normalisées
CREATE TABLE IF NOT EXISTS public.invoices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero       TEXT UNIQUE NOT NULL,
  claim_id     UUID REFERENCES public.payment_claims(id) ON DELETE SET NULL,
  compte_id    UUID NOT NULL,
  compte_type  TEXT NOT NULL DEFAULT 'user' CHECK (compte_type IN ('user', 'org')),
  client_nom   TEXT NOT NULL,
  client_email TEXT,
  client_rccm  TEXT,
  client_ifu   TEXT,
  pack_slug    TEXT NOT NULL,
  pack_nom     TEXT NOT NULL,
  credits      INT  NOT NULL,
  montant_fcfa INT  NOT NULL,
  pdf_url      TEXT,
  cree_le      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_compte ON public.invoices (compte_id, compte_type);
CREATE INDEX IF NOT EXISTS idx_invoices_claim ON public.invoices (claim_id);
CREATE INDEX IF NOT EXISTS idx_invoices_numero ON public.invoices (numero);

-- 3. Fonction pour générer une facture normalisée lors de la livraison d'un pack
CREATE OR REPLACE FUNCTION public.create_invoice_for_claim(p_claim_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_claim RECORD;
  v_pack RECORD;
  v_client_nom TEXT;
  v_client_email TEXT;
  v_client_rccm TEXT;
  v_client_ifu TEXT;
  v_num_seq INT;
  v_numero TEXT;
  v_invoice_id UUID;
  v_current_year TEXT;
BEGIN
  -- Si une facture existe déjà pour ce claim, la retourner (idempotence)
  SELECT id INTO v_invoice_id FROM public.invoices WHERE claim_id = p_claim_id;
  IF v_invoice_id IS NOT NULL THEN
    RETURN v_invoice_id;
  END IF;

  -- Récupérer la déclaration
  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Récupérer le pack
  SELECT * INTO v_pack FROM public.credit_packs WHERE slug = v_claim.pack_slug;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Récupérer les informations du client selon compte_type
  IF v_claim.compte_type = 'org' THEN
    SELECT nom, email_facturation, rccm, ifu
    INTO v_client_nom, v_client_email, v_client_rccm, v_client_ifu
    FROM public.organizations WHERE id = v_claim.compte_id;
  ELSE
    SELECT NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), email
    INTO v_client_nom, v_client_email
    FROM public.profiles WHERE id = v_claim.compte_id;
    v_client_rccm := NULL;
    v_client_ifu := NULL;
  END IF;

  v_client_nom := COALESCE(v_client_nom, v_client_email, 'Client MonCV.ai');
  v_current_year := TO_CHAR(NOW(), 'YYYY');

  -- Obtenir le prochain numéro séquentiel sans trou
  v_num_seq := nextval('public.invoice_number_seq');
  v_numero := 'INV-' || v_current_year || '-' || LPAD(v_num_seq::TEXT, 5, '0');

  -- Insérer la facture
  INSERT INTO public.invoices (
    numero, claim_id, compte_id, compte_type, client_nom, client_email,
    client_rccm, client_ifu, pack_slug, pack_nom, credits, montant_fcfa
  ) VALUES (
    v_numero, p_claim_id, v_claim.compte_id, v_claim.compte_type, v_client_nom,
    v_client_email, v_client_rccm, v_client_ifu, v_pack.slug, v_pack.nom,
    v_pack.credits, v_claim.montant_attendu
  ) RETURNING id INTO v_invoice_id;

  RETURN v_invoice_id;
END;
$$;

-- 4. Mettre à jour livrer_pack_pg pour générer automatiquement la facture
CREATE OR REPLACE FUNCTION public.livrer_pack_pg(p_claim_id UUID, p_admin_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_claim RECORD;
  v_pack RECORD;
  v_reference TEXT;
  v_invoice_id UUID;
BEGIN
  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Déclaration introuvable'); END IF;
  IF v_claim.statut = 'valide' THEN RETURN jsonb_build_object('success', true, 'message', 'Déjà validé', 'idempotent', true); END IF;
  IF v_claim.statut = 'rejete' THEN RETURN jsonb_build_object('success', false, 'message', 'Déclaration rejetée'); END IF;
  SELECT * INTO v_pack FROM public.credit_packs WHERE slug = v_claim.pack_slug;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Pack introuvable: ' || v_claim.pack_slug); END IF;

  v_reference := 'CLAIM_' || p_claim_id::TEXT;

  -- 1. Créditer le compte
  PERFORM public.crediter_lot(v_claim.compte_id, v_claim.compte_type, v_pack.slug, v_pack.credits, v_pack.validite_mois, 'achat', v_reference);

  -- 2. Marquer validé
  UPDATE public.payment_claims SET statut = 'valide', valide_par = p_admin_id, valide_le = NOW() WHERE id = p_claim_id;

  -- 3. Générer la facture normalisée OHADA
  v_invoice_id := public.create_invoice_for_claim(p_claim_id);

  RETURN jsonb_build_object(
    'success', true,
    'message', v_pack.credits || ' crédits accordés — ' || v_pack.nom,
    'credits_accordes', v_pack.credits,
    'pack_slug', v_pack.slug,
    'invoice_id', v_invoice_id
  );
END;
$$;

-- 5. RLS sur invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture factures propriétaire" ON public.invoices;
CREATE POLICY "Lecture factures propriétaire" ON public.invoices FOR SELECT
  USING (
    (compte_type = 'user' AND auth.uid() = compte_id)
    OR (
      compte_type = 'org' AND EXISTS (
        SELECT 1 FROM public.organization_members m
        WHERE m.org_id = invoices.compte_id AND m.user_id = auth.uid()
      )
    )
    OR auth.role() = 'service_role'
  );
