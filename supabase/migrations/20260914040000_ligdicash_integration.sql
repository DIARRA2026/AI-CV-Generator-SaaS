-- =========================================================================
-- MIGRATION: Intégration Opérationnelle LigdiCash (Subscriptions & Transactions)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Création de la table des souscriptions et abonnements
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', '1500', '2500', '5000', 'enterprise30', 'enterprise75', 'enterprise200', 'cyber15')),
  amount INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  payment_method TEXT NOT NULL DEFAULT 'LigdiCash Mobile Money',
  phone_number TEXT,
  transaction_ref TEXT UNIQUE NOT NULL,
  external_token TEXT,
  allowed_candidates INT DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Colonne external_token si la table existait déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'external_token'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN external_token TEXT;
  END IF;
END $$;

-- 2. Mise à jour de la contrainte CHECK sur public.transactions.provider
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_provider_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_provider_check 
  CHECK (provider IN ('wave', 'orange', 'mtn', 'moov', 'stripe', 'card', 'paystack', 'ligdicash'));

-- Colonne external_token sur public.transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'external_token'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN external_token TEXT;
  END IF;
END $$;

-- 3. Index de performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_email ON public.subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ref ON public.subscriptions(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ext_token ON public.subscriptions(external_token);
CREATE INDEX IF NOT EXISTS idx_transactions_ext_token ON public.transactions(external_token);

-- 4. Sécurité Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs consultent leurs abonnements" ON public.subscriptions;
CREATE POLICY "Les utilisateurs consultent leurs abonnements"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Insertion de souscription autorisée" ON public.subscriptions;
CREATE POLICY "Insertion de souscription autorisée"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Mise à jour souscription autorisée" ON public.subscriptions;
CREATE POLICY "Mise à jour souscription autorisée"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (plan_tier = 'enterprise200' OR email IN ('innovagroup225@gmail.com', 'admin@moncv.ai'))
  ));
