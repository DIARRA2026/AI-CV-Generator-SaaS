import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase Haute Sécurité réservé exclusivement au backend (API Routes, Webhooks).
 * Utilise la clé secrète SUPABASE_SERVICE_ROLE_KEY pour opérer hors RLS lors
 * des notifications asynchrones de passerelles de paiement (LigdiCash, etc.).
 *
 * En l'absence de clé de service, utilise la clé anonyme publique configurée
 * dans l'environnement pour maintenir la connectivité standard.
 */
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
).trim();

export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && serviceRoleKey
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
