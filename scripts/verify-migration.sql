-- SCRIPT DE VERIFICATION POST-MIGRATION
-- Executer apres chaque migration pour valider la coherence

-- 1. Verifier que les 8 packs existent
SELECT 'PACKS COUNT' AS test, COUNT(*) AS valeur, 8 AS attendu FROM public.credit_packs WHERE actif;

-- 2. Verifier les 4 packs B2C
SELECT 'B2C COUNT' AS test, COUNT(*) AS valeur, 4 AS attendu FROM public.credit_packs WHERE segment = 'b2c' AND actif;

-- 3. Verifier les 4 packs B2B
SELECT 'B2B COUNT' AS test, COUNT(*) AS valeur, 4 AS attendu FROM public.credit_packs WHERE segment = 'b2b' AND actif;

-- 4. Verifier les 7 couts d actions
SELECT 'ACTION_COSTS COUNT' AS test, COUNT(*) AS valeur, 7 AS attendu FROM public.action_costs WHERE actif;

-- 5. Invariant B2B < B2C (doit retourner 0 ligne)
SELECT 'INVARIANT B2B<B2C VIOLATIONS' AS test, COUNT(*) AS valeur, 0 AS attendu
FROM public.v_invariant_b2b_b2c;

-- 6. Verifier que decouverte a bien 30 credits
SELECT 'DECOUVERTE CREDITS' AS test, credits AS valeur, 30 AS attendu
FROM public.credit_packs WHERE slug = 'decouverte';

-- 7. Verifier le cout cv_complet
SELECT 'CV_COMPLET COST' AS test, cout AS valeur, 10 AS attendu
FROM public.action_costs WHERE cle = 'cv_complet';

-- 8. Verifier l existence des fonctions critiques
SELECT 'FUNCTIONS EXISTANTES' AS test, COUNT(*) AS valeur, 6 AS attendu
FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('solde_credits', 'crediter_lot', 'consommer_credits', 'grant_decouverte', 'livrer_pack_pg', 'rejeter_claim');
