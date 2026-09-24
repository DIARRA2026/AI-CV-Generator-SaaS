-- =========================================================================
-- MIGRATION LOT 2 : ORGANISATIONS MULTI-UTILISATEURS & SIÈGES B2B
-- MonCV.ai — INNOVA GROUP
-- Date : 2026-09-24
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. TABLE DES ORGANISATIONS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom               TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  rccm              TEXT,
  ifu               TEXT,
  adresse           TEXT,
  telephone         TEXT,
  email_facturation TEXT,
  logo_url          TEXT,
  couleur_primaire  TEXT DEFAULT '#2563EB',
  pack_slug         TEXT REFERENCES public.credit_packs(slug) ON DELETE SET NULL,
  actif             BOOLEAN NOT NULL DEFAULT TRUE,
  cree_le           TIMESTAMPTZ DEFAULT NOW(),
  mis_a_jour        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations (slug);

-- -------------------------------------------------------------------------
-- 2. TABLE DES MEMBRES D'ORGANISATION
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'membre' CHECK (role IN ('proprietaire', 'admin', 'membre')),
  invite_par UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cree_le    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members (org_id);

-- -------------------------------------------------------------------------
-- 3. FONCTIONS POSTGRES ET CONTRÔLE DES SIÈGES (SECURITY DEFINER)
-- -------------------------------------------------------------------------

-- F1. Créer une organisation et assigner le créateur comme propriétaire atomiquement
CREATE OR REPLACE FUNCTION public.create_organization(
  p_nom               TEXT,
  p_slug              TEXT,
  p_owner_id          UUID,
  p_pack_slug         TEXT DEFAULT 'revendeur',
  p_rccm              TEXT DEFAULT NULL,
  p_ifu               TEXT DEFAULT NULL,
  p_adresse           TEXT DEFAULT NULL,
  p_telephone         TEXT DEFAULT NULL,
  p_email_facturation TEXT DEFAULT NULL,
  p_logo_url          TEXT DEFAULT NULL,
  p_couleur_primaire  TEXT DEFAULT '#2563EB'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org_id UUID;
  v_clean_slug TEXT;
BEGIN
  v_clean_slug := LOWER(REGEXP_REPLACE(TRIM(p_slug), '[^a-z0-9_-]', '-', 'g'));

  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_clean_slug) THEN
    v_clean_slug := v_clean_slug || '-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
  END IF;

  INSERT INTO public.organizations (
    nom, slug, rccm, ifu, adresse, telephone, email_facturation,
    logo_url, couleur_primaire, pack_slug
  ) VALUES (
    TRIM(p_nom), v_clean_slug, p_rccm, p_ifu, p_adresse, p_telephone,
    p_email_facturation, p_logo_url, p_couleur_primaire, p_pack_slug
  ) RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (org_id, user_id, role, invite_par)
  VALUES (v_org_id, p_owner_id, 'proprietaire', p_owner_id);

  RETURN v_org_id;
END;
$$;

-- F2. Vérifier la limite de sièges d'un pack avant ajout de membre
CREATE OR REPLACE FUNCTION public.check_org_seat_available(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pack_slug TEXT;
  v_sieges_max INT;
  v_membres_actuels INT;
BEGIN
  SELECT pack_slug INTO v_pack_slug FROM public.organizations WHERE id = p_org_id;
  
  IF v_pack_slug IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT sieges INTO v_sieges_max FROM public.credit_packs WHERE slug = v_pack_slug;

  -- Si sieges est NULL, c'est illimité (ex: licence_etablissement)
  IF v_sieges_max IS NULL THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(*) INTO v_membres_actuels FROM public.organization_members WHERE org_id = p_org_id;

  RETURN v_membres_actuels < v_sieges_max;
END;
$$;

-- F3. Ajouter un membre par email dans l'organisation
CREATE OR REPLACE FUNCTION public.add_org_member(
  p_org_id    UUID,
  p_email     TEXT,
  p_role      TEXT,
  p_admin_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_admin_role TEXT;
  v_target_user_id UUID;
  v_seat_ok BOOLEAN;
BEGIN
  -- Vérifier les droits de l'appelant (doit être proprietaire ou admin)
  SELECT role INTO v_admin_role
  FROM public.organization_members
  WHERE org_id = p_org_id AND user_id = p_admin_id;

  IF v_admin_role IS NULL OR v_admin_role NOT IN ('proprietaire', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Permissions insuffisantes.');
  END IF;

  -- Trouver l'utilisateur par son email dans auth.users
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(p_email));

  IF v_target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Aucun compte trouvé avec cet email.');
  END IF;

  -- Vérifier s'il est déjà membre
  IF EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = p_org_id AND user_id = v_target_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cet utilisateur est déjà membre de l organisation.');
  END IF;

  -- Vérifier la limite de sièges
  v_seat_ok := public.check_org_seat_available(p_org_id);
  IF NOT v_seat_ok THEN
    RETURN jsonb_build_object('success', false, 'message', 'Limite de sièges atteinte pour le pack actuel.');
  END IF;

  -- Ajouter le membre
  INSERT INTO public.organization_members (org_id, user_id, role, invite_par)
  VALUES (p_org_id, v_target_user_id, COALESCE(p_role, 'membre'), p_admin_id);

  RETURN jsonb_build_object('success', true, 'message', 'Membre ajouté avec succès.', 'user_id', v_target_user_id);
END;
$$;

-- F4. Retirer un membre de l'organisation
CREATE OR REPLACE FUNCTION public.remove_org_member(
  p_org_id       UUID,
  p_target_id    UUID,
  p_caller_id    UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_role TEXT;
  v_target_role TEXT;
BEGIN
  SELECT role INTO v_caller_role FROM public.organization_members WHERE org_id = p_org_id AND user_id = p_caller_id;
  SELECT role INTO v_target_role FROM public.organization_members WHERE org_id = p_org_id AND user_id = p_target_id;

  IF v_target_role = 'proprietaire' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Impossible de retirer le propriétaire.');
  END IF;

  IF v_caller_id != p_target_id THEN
    IF v_caller_role IS NULL OR (v_caller_role != 'proprietaire' AND v_caller_role != 'admin') THEN
      RETURN jsonb_build_object('success', false, 'message', 'Permissions insuffisantes.');
    END IF;
  END IF;

  DELETE FROM public.organization_members WHERE org_id = p_org_id AND user_id = p_target_id;

  RETURN jsonb_build_object('success', true, 'message', 'Membre retiré.');
END;
$$;

-- -------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membres peuvent voir leur organisation" ON public.organizations;
CREATE POLICY "Membres peuvent voir leur organisation" ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.org_id = organizations.id AND m.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Admins peuvent modifier leur organisation" ON public.organizations;
CREATE POLICY "Admins peuvent modifier leur organisation" ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.org_id = organizations.id AND m.user_id = auth.uid()
        AND m.role IN ('proprietaire', 'admin')
    )
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Membres peuvent voir les membres de leur organisation" ON public.organization_members;
CREATE POLICY "Membres peuvent voir les membres de leur organisation" ON public.organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.org_id = organization_members.org_id AND m.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );
