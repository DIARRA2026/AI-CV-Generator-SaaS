import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase Haute Sécurité réservé exclusivement au backend (API Routes, Webhooks).
 * Utilise la clé secrète SUPABASE_SERVICE_ROLE_KEY pour opérer hors RLS lors
 * des notifications asynchrones de passerelles de paiement (LigdiCash, etc.).
 *
 * En l'absence de clé de service, utilise la clé anonyme publique configurée
 * dans l'environnement pour maintenir la connectivité standard.
 */
const FALLBACK_SUPABASE_URL = "https://otgxrewddogacbsgteyz.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90Z3hyZXdkZG9nYWNic2d0ZXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NjY3ODIsImV4cCI6MjEwNDA0Mjc4Mn0.CiEQ_Q567aEKcyj1hOwnavnvPvrwtchucVrusoUwVlI";

const supabaseUrl = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  FALLBACK_SUPABASE_URL
).trim();

const serviceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  FALLBACK_SUPABASE_ANON_KEY
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
