-- =========================================================================
-- MIGRATION: Assouplissement des contraintes plan_tier et optimisation index
-- MonCV.ai — INNOVA GROUP
-- Date : 2026-10-01
-- =========================================================================

-- 1. Supprimer les contraintes restrictives sur plan_tier pour accepter tous les slugs B2C et B2B
ALTER TABLE IF EXISTS public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_tier_check;
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_tier_check;

-- 2. Index de performance pour les recherches rapides par référence Wave
CREATE INDEX IF NOT EXISTS idx_payment_claims_ref_tx ON public.payment_claims (reference_transaction);
CREATE INDEX IF NOT EXISTS idx_transactions_ref_code ON public.transactions (reference_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ref_tx ON public.subscriptions (transaction_ref);
