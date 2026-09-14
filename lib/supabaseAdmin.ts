import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase Haute Sécurité réservé exclusivement au backend (API Routes, Webhooks).
 * Utilise la clé secrète SUPABASE_SERVICE_ROLE_KEY pour opérer hors RLS lors
 * des notifications asynchrones de passerelles de paiement (LigdiCash, etc.).
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://otgxrewddogacbsgteyz.supabase.co";

// Clé de service (ou clé anon de repli)
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const supabaseAdmin: SupabaseClient | null = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "x-application-name": "moncv-saas-admin-worker",
        },
      },
    })
  : null;
