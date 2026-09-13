-- =========================================================================
-- MIGRATION: Création de la table subscriptions (Statut pending & RLS)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', '1500', '2500', '5000', 'enterprise30', 'enterprise75', 'enterprise200', 'cyber15')),
  amount INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  payment_method TEXT NOT NULL DEFAULT 'Wave Mobile Money (CI)',
  phone_number TEXT,
  transaction_ref TEXT UNIQUE NOT NULL,
  allowed_candidates INT DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_email ON public.subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ref ON public.subscriptions(transaction_ref);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs consultent leurs abonnements"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Insertion de souscription autorisée"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Mise à jour souscription autorisée"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (plan_tier = 'enterprise200' OR email IN ('innovagroup225@gmail.com', 'admin@moncv.ai'))
  ));
