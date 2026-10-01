-- =========================================================================
-- MIGRATION : CLOISONNEMENT STRICT DES DONNÉES & ROW LEVEL SECURITY (RLS)
-- MonCV.ai — INNOVA GROUP
-- Date : 2026-10-01
--
-- OBJECTIF :
-- 1. Isolation étanche entre comptes particuliers (candidats) et entreprises (recruteurs)
-- 2. Aucun accès croisé possible, même via requêtes directes à l'API Supabase Client
-- 3. Règle absolue : Chaque client particulier ne voit QUE ses propres données (user_id = auth.uid())
-- 4. Règle absolue : Chaque entreprise ne voit QUE ses propres données d'organisation
-- 5. Protection anti-usurpation sur les abonnements, transactions et factures OHADA
-- =========================================================================

-- -------------------------------------------------------------------------
-- ÉTAPE 1 : CRÉATION DE LA TABLE CVS (OU SYNCHRONISATION AVEC RESUMES)
-- Garantit la disponibilité des tables 'resumes' et 'cvs' avec schémas protégés
-- -------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_slug ON public.cvs(slug);

-- -------------------------------------------------------------------------
-- ÉTAPE 2 : ACTIVATION ET FORÇAGE DU ROW LEVEL SECURITY SUR TOUTES LES TABLES
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters FORCE ROW LEVEL SECURITY;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications FORCE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    EXECUTE 'ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY; ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    EXECUTE 'ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY; ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members') THEN
    EXECUTE 'ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY; ALTER TABLE public.organization_members FORCE ROW LEVEL SECURITY;';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credit_wallets') THEN
    EXECUTE 'ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY; ALTER TABLE public.credit_wallets FORCE ROW LEVEL SECURITY;';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credit_ledger') THEN
    EXECUTE 'ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY; ALTER TABLE public.credit_ledger FORCE ROW LEVEL SECURITY;';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- ÉTAPE 3 : NETTOYAGE DES ANCIENNES POLITIQUES PERMISSIVES
-- -------------------------------------------------------------------------
-- Nettoyage sur profiles
DROP POLICY IF EXISTS "Lecture profils propriétaire" ON public.profiles;
DROP POLICY IF EXISTS "Création profil utilisateur" ON public.profiles;
DROP POLICY IF EXISTS "Mise à jour profil utilisateur" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Nettoyage sur resumes & cvs
DROP POLICY IF EXISTS "Lecture CVs publics et propriétaires" ON public.resumes;
DROP POLICY IF EXISTS "Insertion CVs propriétaire" ON public.resumes;
DROP POLICY IF EXISTS "Mise à jour CVs propriétaire" ON public.resumes;
DROP POLICY IF EXISTS "Suppression CVs propriétaire" ON public.resumes;
DROP POLICY IF EXISTS "resumes_select_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_insert_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_update_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_delete_own" ON public.resumes;

DROP POLICY IF EXISTS "cvs_select_own" ON public.cvs;
DROP POLICY IF EXISTS "cvs_insert_own" ON public.cvs;
DROP POLICY IF EXISTS "cvs_update_own" ON public.cvs;
DROP POLICY IF EXISTS "cvs_delete_own" ON public.cvs;

-- Nettoyage sur portfolios
DROP POLICY IF EXISTS "Les utilisateurs gèrent leurs propres portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Tout le monde peut voir un portfolio publié" ON public.portfolios;
DROP POLICY IF EXISTS "portfolios_select_policy" ON public.portfolios;
DROP POLICY IF EXISTS "portfolios_modify_own" ON public.portfolios;

-- Nettoyage sur subscriptions
DROP POLICY IF EXISTS "Lecture souscriptions propriétaire et service" ON public.subscriptions;
DROP POLICY IF EXISTS "Insertion souscription sécurisée" ON public.subscriptions;
DROP POLICY IF EXISTS "Mise à jour souscription réservée au backend" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_service_update" ON public.subscriptions;

-- Nettoyage sur cover_letters & job_applications
DROP POLICY IF EXISTS "Isolation stricte des lettres de motivation" ON public.cover_letters;
DROP POLICY IF EXISTS "Isolation stricte des demandes d'emploi" ON public.job_applications;

-- -------------------------------------------------------------------------
-- ÉTAPE 4 : NOUVELLES POLITIQUES RLS ULTRA-STRICTES (ISOLATION TOTALE)
-- -------------------------------------------------------------------------

-- =========================================================================
-- 1. TABLE : PROFILES (Profils individuels et administrateurs RH)
-- =========================================================================
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- =========================================================================
-- 2. TABLES : RESUMES & CVS (CVs Professionnels ATS)
-- Cloisonnement absolu : Chaque candidat ne lit/modifie que ses propres CVs.
-- Aucune entreprise ne peut voir les CVs personnels sans délégation explicite.
-- =========================================================================
CREATE POLICY "resumes_select_own"
  ON public.resumes FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "resumes_insert_own"
  ON public.resumes FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "resumes_update_own"
  ON public.resumes FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "resumes_delete_own"
  ON public.resumes FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

-- Politiques miroirs sur la table 'cvs'
CREATE POLICY "cvs_select_own"
  ON public.cvs FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "cvs_insert_own"
  ON public.cvs FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "cvs_update_own"
  ON public.cvs FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "cvs_delete_own"
  ON public.cvs FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

-- =========================================================================
-- 3. TABLE : PORTFOLIOS (Portfolios Web d'Élite)
-- Seul l'auteur peut gérer son portfolio. La lecture publique est réservée
-- aux portfolios publiés (slug accessible aux recruteurs externes).
-- =========================================================================
CREATE POLICY "portfolios_select_policy"
  ON public.portfolios FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR is_published = TRUE
    OR auth.role() = 'service_role'
  );

CREATE POLICY "portfolios_insert_own"
  ON public.portfolios FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "portfolios_update_own"
  ON public.portfolios FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "portfolios_delete_own"
  ON public.portfolios FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

-- =========================================================================
-- 4. TABLE : SUBSCRIPTIONS (Abonnements & Formules Payantes)
-- Seul l'utilisateur propriétaire peut consulter son abonnement.
-- La mise à jour est STRICTEMENT verrouillée au service_role (webhooks Wave/LigdiCash).
-- =========================================================================
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "subscriptions_insert_own"
  ON public.subscriptions FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id AND status = 'pending')
    OR auth.role() = 'service_role'
  );

CREATE POLICY "subscriptions_service_update"
  ON public.subscriptions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "subscriptions_service_delete"
  ON public.subscriptions FOR DELETE
  USING (auth.role() = 'service_role');

-- =========================================================================
-- 5. TABLE : INVOICES (Factures Normalisées OHADA)
-- Cloisonnement :
--   - Un particulier (compte_type='user') ne voit QUE ses factures (compte_id = auth.uid())
--   - Une entreprise (compte_type='org') ne voit QUE les factures de son organisation
--   - Aucune entreprise ne peut voir les factures d'une autre entreprise
-- =========================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    DROP POLICY IF EXISTS "invoices_select_policy" ON public.invoices;
    DROP POLICY IF EXISTS "invoices_service_all" ON public.invoices;

    CREATE POLICY "invoices_select_policy"
      ON public.invoices FOR SELECT
      USING (
        auth.role() = 'service_role'
        OR (
          compte_type = 'user' 
          AND compte_id = auth.uid()
        )
        OR (
          compte_type = 'org'
          AND EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE org_id = invoices.compte_id 
              AND user_id = auth.uid()
          )
        )
      );

    CREATE POLICY "invoices_service_all"
      ON public.invoices FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- =========================================================================
-- 6. TABLES : ORGANIZATIONS & ORGANIZATION_MEMBERS (Cloisonnement Entreprises)
-- Une entreprise A ne peut en aucun cas lire ou modifier les données de l'entreprise B.
-- =========================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    DROP POLICY IF EXISTS "orgs_select_member" ON public.organizations;
    DROP POLICY IF EXISTS "orgs_update_owner" ON public.organizations;

    CREATE POLICY "orgs_select_member"
      ON public.organizations FOR SELECT
      USING (
        auth.role() = 'service_role'
        OR EXISTS (
          SELECT 1 FROM public.organization_members
          WHERE org_id = organizations.id 
            AND user_id = auth.uid()
        )
      );

    CREATE POLICY "orgs_update_owner"
      ON public.organizations FOR UPDATE
      USING (
        auth.role() = 'service_role'
        OR EXISTS (
          SELECT 1 FROM public.organization_members
          WHERE org_id = organizations.id 
            AND user_id = auth.uid() 
            AND role IN ('proprietaire', 'admin')
        )
      );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members') THEN
    DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
    
    CREATE POLICY "org_members_select"
      ON public.organization_members FOR SELECT
      USING (
        auth.role() = 'service_role'
        OR user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members AS m
          WHERE m.org_id = organization_members.org_id 
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =========================================================================
-- 7. TABLES : COVER_LETTERS & JOB_APPLICATIONS (Documents Confidentiels)
-- =========================================================================
CREATE POLICY "cover_letters_own"
  ON public.cover_letters FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "job_applications_own"
  ON public.job_applications FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- =========================================================================
-- FIN DU SCRIPT DE MIGRATION RLS
-- Toutes les tables sont hermétiquement cloisonnées.
-- =========================================================================
