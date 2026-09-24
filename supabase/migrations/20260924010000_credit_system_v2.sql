-- =========================================================================
-- MIGRATION LOT 1 : SYSTÈME DE CRÉDITS PRÉPAYÉS B2C & B2B
-- MonCV.ai — INNOVA GROUP
-- Date : 2026-09-24
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. TABLE DES COÛTS DES ACTIONS IA (source de vérité côté serveur)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.action_costs (
  cle          TEXT PRIMARY KEY,
  libelle      TEXT NOT NULL,
  cout         INT  NOT NULL CHECK (cout >= 0),
  actif        BOOLEAN NOT NULL DEFAULT TRUE,
  cree_le      TIMESTAMPTZ DEFAULT NOW(),
  mis_a_jour   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.action_costs (cle, libelle, cout, actif) VALUES
  ('cv_complet',          'CV complet (génération / réécriture IA)',   10, TRUE),
  ('lettre_motivation',   'Lettre de motivation personnalisée IA',       5, TRUE),
  ('analyse_ats',         'Analyse & Score ATS',                         5, TRUE),
  ('traduction_anglais',  'Traduction CV en Anglais IA',                 8, TRUE),
  ('photo_ia',            'Photo de profil professionnelle IA',         25, TRUE),
  ('export_pdf',          'Export PDF (gratuit & illimité)',              0, TRUE),
  ('export_docx',         'Export DOCX (gratuit & illimité)',             0, TRUE)
ON CONFLICT (cle) DO UPDATE SET libelle = EXCLUDED.libelle, cout = EXCLUDED.cout, actif = EXCLUDED.actif, mis_a_jour = NOW();

ALTER TABLE public.action_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique barème" ON public.action_costs;
CREATE POLICY "Lecture publique barème" ON public.action_costs FOR SELECT USING (TRUE);

-- -------------------------------------------------------------------------
-- 2. TABLE DES PACKS DE CRÉDITS (B2C + B2B)
-- -------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='credit_packs' AND table_schema='public') THEN
    CREATE TABLE IF NOT EXISTS public.credit_packs_backup_v1 AS SELECT * FROM public.credit_packs;
  END IF;
END $$;

DROP TABLE IF EXISTS public.credit_packs CASCADE;

CREATE TABLE public.credit_packs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  nom             TEXT NOT NULL,
  segment         TEXT NOT NULL CHECK (segment IN ('b2c', 'b2b')),
  prix_fcfa       INT  NOT NULL DEFAULT 0,
  credits         INT  NOT NULL CHECK (credits > 0),
  validite_mois   INT,
  sieges          INT,
  ordre           INT  NOT NULL DEFAULT 0,
  actif           BOOLEAN NOT NULL DEFAULT TRUE,
  mis_en_avant    BOOLEAN NOT NULL DEFAULT FALSE,
  cible           TEXT,
  avantages       JSONB NOT NULL DEFAULT '{"herite_de": null, "ajouts": []}'::jsonb,
  cree_le         TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.credit_packs (slug, nom, segment, prix_fcfa, credits, validite_mois, sieges, ordre, actif, mis_en_avant, cible, avantages) VALUES
  ('decouverte', 'Découverte', 'b2c', 0, 30, NULL, 1, 1, TRUE, FALSE, 'Tout utilisateur qui crée un compte',
   '{"herite_de":null,"ajouts":["30 crédits offerts à l inscription","Génère 1 CV + 1 lettre + 1 analyse ATS","Création manuelle et édition illimitées","Export PDF & Word sans filigrane gratuit","Facture normalisée OHADA disponible"]}'::jsonb),
  ('essentiel', 'Essentiel', 'b2c', 1500, 120, 12, 1, 2, TRUE, FALSE, 'Candidat en recherche active',
   '{"herite_de":null,"ajouts":["120 crédits valables 12 mois","Soit 12 CV complets ou 24 lettres de motivation","125 F le crédit","Export PDF & Word sans filigrane","Facture normalisée OHADA"]}'::jsonb),
  ('evolution', 'Évolution', 'b2c', 2500, 250, 12, 1, 3, TRUE, FALSE, 'Candidat qui multiplie les candidatures',
   '{"herite_de":null,"ajouts":["250 crédits valables 12 mois","Soit 25 CV complets ou 50 lettres de motivation","10 F le crédit (économie 20%)","Export PDF & Word sans filigrane","Facture normalisée OHADA"]}'::jsonb),
  ('carriere', 'Carrière', 'b2c', 5000, 600, 12, 1, 4, TRUE, TRUE, 'Candidat exigeant, reconversion, international',
   '{"herite_de":null,"ajouts":["600 crédits valables 12 mois","Soit 60 CV complets — photo IA incluse (25 cr.)","8,33 F le crédit (meilleur rapport B2C)","Photo de profil professionnelle IA incluse","Export PDF & Word sans filigrane","Facture normalisée OHADA"]}'::jsonb),
  ('revendeur', 'Revendeur', 'b2b', 10000, 1500, 12, 1, 5, TRUE, FALSE, 'Agence RH, cabinet, point de vente',
   '{"herite_de":null,"ajouts":["1 500 crédits valables 12 mois","Soit 150 profils complets (CV + lettre + ATS)","6,67 F le crédit","Compte structure avec nom de l agence","Recharge en un clic","Facture normalisée OHADA"]}'::jsonb),
  ('structure', 'Structure', 'b2b', 25000, 5000, 12, 3, 6, TRUE, FALSE, 'PME, ONG, structure éducative',
   '{"herite_de":"revendeur","ajouts":["5 000 crédits valables 12 mois","Soit 500 profils complets","5,00 F le crédit","3 utilisateurs simultanés","Logo et couleurs de la structure","Export groupé CSV","Facture normalisée OHADA"]}'::jsonb),
  ('business_pro', 'Business Pro', 'b2b', 60000, 15000, 12, 10, 7, TRUE, TRUE, 'Entreprise RH, cabinet conseil, école',
   '{"herite_de":"structure","ajouts":["15 000 crédits valables 12 mois","Soit 1 500 profils complets","4,00 F le crédit","10 utilisateurs simultanés","Tableau de bord analytics","Import en lot (CSV)","Support WhatsApp prioritaire","Facture normalisée OHADA"]}'::jsonb),
  ('licence_etablissement', 'Licence Établissement', 'b2b', 150000, 50000, 12, NULL, 8, TRUE, FALSE, 'Grande école, université',
   '{"herite_de":"business_pro","ajouts":["50 000 crédits valables 12 mois","Soit 5 000 profils complets","3,00 F le crédit","Utilisateurs illimités","Espaces par promotion ou filière","Gestionnaire de compte dédié","Devis sur bon de commande possible","Facture normalisée OHADA"]}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom, segment = EXCLUDED.segment, prix_fcfa = EXCLUDED.prix_fcfa,
  credits = EXCLUDED.credits, validite_mois = EXCLUDED.validite_mois,
  sieges = EXCLUDED.sieges, ordre = EXCLUDED.ordre, actif = EXCLUDED.actif,
  mis_en_avant = EXCLUDED.mis_en_avant, cible = EXCLUDED.cible, avantages = EXCLUDED.avantages;

ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique packs" ON public.credit_packs;
CREATE POLICY "Lecture publique packs" ON public.credit_packs FOR SELECT USING (actif = TRUE OR auth.role() = 'service_role');

-- -------------------------------------------------------------------------
-- 3. credit_batches (refonte : compte_id + compte_type)
-- -------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.credit_batches_backup_v1 AS SELECT * FROM public.credit_batches;
END $$;
DROP TABLE IF EXISTS public.credit_batches CASCADE;

CREATE TABLE public.credit_batches (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compte_id        UUID NOT NULL,
  compte_type      TEXT NOT NULL DEFAULT 'user' CHECK (compte_type IN ('user', 'org')),
  pack_slug        TEXT REFERENCES public.credit_packs(slug) ON DELETE SET NULL,
  credits_initiaux INT  NOT NULL CHECK (credits_initiaux > 0),
  restant          INT  NOT NULL CHECK (restant >= 0),
  cree_le          TIMESTAMPTZ DEFAULT NOW(),
  expire_le        TIMESTAMPTZ,
  origine          TEXT NOT NULL DEFAULT 'offert' CHECK (origine IN ('offert', 'achat', 'migration', 'bonus', 'pilote')),
  actif            BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_batches_compte_expiry ON public.credit_batches (compte_id, expire_le) WHERE restant > 0;
CREATE INDEX IF NOT EXISTS idx_batches_compte_type_active ON public.credit_batches (compte_id, compte_type, actif) WHERE restant > 0;

ALTER TABLE public.credit_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture batches propriétaire" ON public.credit_batches;
CREATE POLICY "Lecture batches propriétaire" ON public.credit_batches FOR SELECT
  USING ((compte_type = 'user' AND auth.uid() = compte_id) OR auth.role() = 'service_role');

-- -------------------------------------------------------------------------
-- 4. credit_ledger (refonte : reference UNIQUE pour idempotence)
-- -------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.credit_ledger_backup_v1 AS SELECT * FROM public.credit_ledger;
END $$;
DROP TABLE IF EXISTS public.credit_ledger CASCADE;

CREATE TABLE public.credit_ledger (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compte_id    UUID NOT NULL,
  compte_type  TEXT NOT NULL DEFAULT 'user' CHECK (compte_type IN ('user', 'org')),
  lot_id       UUID REFERENCES public.credit_batches(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  montant      INT  NOT NULL,
  reference    TEXT UNIQUE NOT NULL,
  meta         JSONB NOT NULL DEFAULT '{}'::jsonb,
  cree_le      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_compte ON public.credit_ledger (compte_id, cree_le DESC);

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture ledger propriétaire" ON public.credit_ledger;
CREATE POLICY "Lecture ledger propriétaire" ON public.credit_ledger FOR SELECT
  USING ((compte_type = 'user' AND auth.uid() = compte_id) OR auth.role() = 'service_role');

-- -------------------------------------------------------------------------
-- 5. decouverte_granted (idempotence par email)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.decouverte_granted (
  email       TEXT PRIMARY KEY,
  compte_id   UUID NOT NULL,
  cree_le     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.decouverte_granted ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin only decouverte_granted" ON public.decouverte_granted;
CREATE POLICY "Admin only decouverte_granted" ON public.decouverte_granted FOR SELECT USING (auth.role() = 'service_role');

-- -------------------------------------------------------------------------
-- 6. payment_claims (refonte : compte_type, operateur, reference_unique)
-- -------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.payment_claims_backup_v1 AS SELECT * FROM public.payment_claims;
END $$;
DROP TABLE IF EXISTS public.payment_claims CASCADE;

CREATE TABLE public.payment_claims (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compte_id             UUID NOT NULL,
  compte_type           TEXT NOT NULL DEFAULT 'user' CHECK (compte_type IN ('user', 'org')),
  pack_slug             TEXT NOT NULL REFERENCES public.credit_packs(slug),
  montant_attendu       INT  NOT NULL,
  telephone             TEXT,
  operateur             TEXT NOT NULL DEFAULT 'wave' CHECK (operateur IN ('wave', 'orange_money', 'autre')),
  reference_transaction TEXT,
  screenshot_url        TEXT,
  statut                TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
  valide_par            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  valide_le             TIMESTAMPTZ,
  note                  TEXT,
  cree_le               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_statut ON public.payment_claims (statut, cree_le DESC);
CREATE INDEX IF NOT EXISTS idx_claims_compte ON public.payment_claims (compte_id, compte_type, cree_le DESC);

ALTER TABLE public.payment_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture claims propriétaire" ON public.payment_claims;
CREATE POLICY "Lecture claims propriétaire" ON public.payment_claims FOR SELECT
  USING ((compte_type = 'user' AND auth.uid() = compte_id) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Création claim propriétaire" ON public.payment_claims;
CREATE POLICY "Création claim propriétaire" ON public.payment_claims FOR INSERT
  WITH CHECK ((compte_type = 'user' AND auth.uid() = compte_id AND statut = 'en_attente') OR auth.role() = 'service_role');

-- =========================================================================
-- FONCTIONS POSTGRES
-- =========================================================================

CREATE OR REPLACE FUNCTION public.solde_credits(p_compte UUID, p_type TEXT DEFAULT 'user')
RETURNS TABLE (solde INT, prochaine_expiration TIMESTAMPTZ, nb_lots INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY SELECT
    COALESCE(SUM(b.restant), 0)::INT,
    MIN(b.expire_le) FILTER (WHERE b.expire_le IS NOT NULL),
    COUNT(b.id)::INT
  FROM public.credit_batches b
  WHERE b.compte_id = p_compte AND b.compte_type = p_type
    AND b.restant > 0 AND (b.expire_le IS NULL OR b.expire_le > NOW());
END; $$;

CREATE OR REPLACE FUNCTION public.crediter_lot(
  p_compte UUID, p_type TEXT, p_pack_slug TEXT, p_credits INT,
  p_validite INT, p_origine TEXT, p_reference TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_expire_le TIMESTAMPTZ; v_lot_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.credit_ledger WHERE reference = p_reference) THEN
    SELECT lot_id INTO v_lot_id FROM public.credit_ledger WHERE reference = p_reference LIMIT 1;
    RETURN v_lot_id;
  END IF;
  IF p_validite IS NOT NULL AND p_validite > 0 THEN
    v_expire_le := NOW() + (p_validite || ' months')::INTERVAL;
  END IF;
  INSERT INTO public.credit_batches (compte_id, compte_type, pack_slug, credits_initiaux, restant, origine, expire_le)
  VALUES (p_compte, p_type, p_pack_slug, p_credits, p_credits, p_origine, v_expire_le)
  RETURNING id INTO v_lot_id;
  INSERT INTO public.credit_ledger (compte_id, compte_type, lot_id, action, montant, reference, meta)
  VALUES (p_compte, p_type, v_lot_id,
    CASE p_origine WHEN 'offert' THEN 'welcome_gift' WHEN 'pilote' THEN 'pilot_grant' ELSE 'purchase' END,
    p_credits, p_reference, jsonb_build_object('pack_slug', p_pack_slug, 'origine', p_origine));
  RETURN v_lot_id;
END; $$;

CREATE OR REPLACE FUNCTION public.consommer_credits(
  p_compte UUID, p_type TEXT DEFAULT 'user', p_action TEXT DEFAULT NULL,
  p_reference TEXT DEFAULT NULL, p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (ok BOOLEAN, restant INT, motif TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cout INT; v_solde INT; v_lot RECORD; v_pris INT; v_reste_a_payer INT; v_ref TEXT;
BEGIN
  IF p_reference IS NOT NULL AND EXISTS (SELECT 1 FROM public.credit_ledger l WHERE l.reference = p_reference) THEN
    SELECT s.solde INTO v_solde FROM public.solde_credits(p_compte, p_type) s;
    RETURN QUERY SELECT TRUE, v_solde, 'deja_debite'::TEXT; RETURN;
  END IF;
  SELECT c.cout INTO v_cout FROM public.action_costs c WHERE c.cle = p_action AND c.actif;
  IF v_cout IS NULL THEN
    SELECT s.solde INTO v_solde FROM public.solde_credits(p_compte, p_type) s;
    RETURN QUERY SELECT FALSE, v_solde, 'action_inconnue'::TEXT; RETURN;
  END IF;
  IF v_cout = 0 THEN
    SELECT s.solde INTO v_solde FROM public.solde_credits(p_compte, p_type) s;
    RETURN QUERY SELECT TRUE, v_solde, 'gratuit'::TEXT; RETURN;
  END IF;
  PERFORM 1 FROM public.credit_batches b
    WHERE b.compte_id = p_compte AND b.compte_type = p_type AND b.restant > 0
      AND (b.expire_le IS NULL OR b.expire_le > NOW()) FOR UPDATE;
  SELECT s.solde INTO v_solde FROM public.solde_credits(p_compte, p_type) s;
  IF v_solde < v_cout THEN
    RETURN QUERY SELECT FALSE, v_solde, ('solde_insuffisant:' || v_solde || ':' || v_cout)::TEXT; RETURN;
  END IF;
  v_reste_a_payer := v_cout;
  FOR v_lot IN
    SELECT b.id, b.restant FROM public.credit_batches b
    WHERE b.compte_id = p_compte AND b.compte_type = p_type AND b.restant > 0
      AND (b.expire_le IS NULL OR b.expire_le > NOW())
    ORDER BY b.expire_le ASC NULLS LAST, b.cree_le ASC FOR UPDATE
  LOOP
    EXIT WHEN v_reste_a_payer <= 0;
    v_pris := LEAST(v_lot.restant, v_reste_a_payer);
    UPDATE public.credit_batches b SET restant = b.restant - v_pris WHERE b.id = v_lot.id;
    v_ref := COALESCE(p_reference, 'GEN_' || gen_random_uuid()::TEXT);
    INSERT INTO public.credit_ledger (compte_id, compte_type, lot_id, action, montant, reference, meta)
    VALUES (p_compte, p_type, v_lot.id, p_action, -v_pris, v_ref, p_meta)
    ON CONFLICT (reference) DO NOTHING;
    v_reste_a_payer := v_reste_a_payer - v_pris;
  END LOOP;
  SELECT s.solde INTO v_solde FROM public.solde_credits(p_compte, p_type) s;
  RETURN QUERY SELECT TRUE, v_solde, 'ok'::TEXT;
END; $$;

CREATE OR REPLACE FUNCTION public.grant_decouverte(
  p_compte_id UUID, p_type TEXT DEFAULT 'user', p_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email TEXT;
BEGIN
  IF p_email IS NULL THEN SELECT email INTO v_email FROM auth.users WHERE id = p_compte_id;
  ELSE v_email := LOWER(TRIM(p_email)); END IF;
  IF v_email IS NULL THEN RETURN FALSE; END IF;
  BEGIN
    INSERT INTO public.decouverte_granted (email, compte_id) VALUES (v_email, p_compte_id);
  EXCEPTION WHEN unique_violation THEN RETURN FALSE; END;
  PERFORM public.crediter_lot(p_compte_id, p_type, 'decouverte', 30, NULL, 'offert', 'DECOUVERTE_' || p_compte_id::TEXT);
  RETURN TRUE;
END; $$;

CREATE OR REPLACE FUNCTION public.livrer_pack_pg(p_claim_id UUID, p_admin_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_claim RECORD; v_pack RECORD; v_reference TEXT;
BEGIN
  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Déclaration introuvable'); END IF;
  IF v_claim.statut = 'valide' THEN RETURN jsonb_build_object('success', true, 'message', 'Déjà validé', 'idempotent', true); END IF;
  IF v_claim.statut = 'rejete' THEN RETURN jsonb_build_object('success', false, 'message', 'Déclaration rejetée'); END IF;
  SELECT * INTO v_pack FROM public.credit_packs WHERE slug = v_claim.pack_slug;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Pack introuvable: ' || v_claim.pack_slug); END IF;
  v_reference := 'CLAIM_' || p_claim_id::TEXT;
  PERFORM public.crediter_lot(v_claim.compte_id, v_claim.compte_type, v_pack.slug, v_pack.credits, v_pack.validite_mois, 'achat', v_reference);
  UPDATE public.payment_claims SET statut = 'valide', valide_par = p_admin_id, valide_le = NOW() WHERE id = p_claim_id;
  RETURN jsonb_build_object('success', true, 'message', v_pack.credits || ' crédits accordés — ' || v_pack.nom, 'credits_accordes', v_pack.credits, 'pack_slug', v_pack.slug);
END; $$;

CREATE OR REPLACE FUNCTION public.rejeter_claim(p_claim_id UUID, p_admin_id UUID, p_motif TEXT DEFAULT 'Référence introuvable')
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.payment_claims
  SET statut = 'rejete', note = p_motif, valide_par = p_admin_id, valide_le = NOW()
  WHERE id = p_claim_id AND statut = 'en_attente';
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Introuvable ou déjà traitée'); END IF;
  RETURN jsonb_build_object('success', true, 'message', 'Déclaration rejetée');
END; $$;

-- TRIGGER inscription → découverte
CREATE OR REPLACE FUNCTION public.trg_grant_decouverte_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.grant_decouverte(NEW.id, 'user', NEW.email); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_grant_decouverte ON public.profiles;
CREATE TRIGGER trg_grant_decouverte AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_grant_decouverte_fn();

-- VUE INVARIANT B2B < B2C (doit retourner 0 ligne)
CREATE OR REPLACE VIEW public.v_invariant_b2b_b2c AS
SELECT b.slug, b.nom, ROUND(b.prix_fcfa::NUMERIC / b.credits, 4) AS prix_credit_b2b, c.seuil_b2c
FROM public.credit_packs b
CROSS JOIN LATERAL (SELECT ROUND(MIN(prix_fcfa::NUMERIC / credits), 4) AS seuil_b2c FROM public.credit_packs WHERE segment='b2c' AND prix_fcfa>0 AND actif) c
WHERE b.segment='b2b' AND b.actif AND b.prix_fcfa>0
  AND b.prix_fcfa::NUMERIC / b.credits >= c.seuil_b2c;

-- Migration des utilisateurs existants
DO $$
DECLARE v_prof RECORD;
BEGIN
  FOR v_prof IN SELECT p.id, p.email FROM public.profiles p
    WHERE NOT EXISTS (SELECT 1 FROM public.decouverte_granted dg WHERE dg.email = LOWER(p.email))
  LOOP
    PERFORM public.grant_decouverte(v_prof.id, 'user', v_prof.email);
  END LOOP;
END $$;
