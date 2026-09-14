import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://otgxrewddogacbsgteyz.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90Z3hyZXdkZG9nYWNic2d0ZXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NjY3ODIsImV4cCI6MjEwNDA0Mjc4Mn0.CiEQ_Q567aEKcyj1hOwnavnvPvrwtchucVrusoUwVlI";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === "string" &&
    supabaseUrl.trim().length > 0 &&
    supabaseUrl.startsWith("http") &&
    typeof supabaseAnonKey === "string" &&
    supabaseAnonKey.trim().length > 0
  );
};

/**
 * Wrapper Fetch ultra-résilient avec reconnexion automatique (Auto-Retry)
 * Garantit la stabilité sur connexions mobiles ou intermittentes
 */
const resilientFetch: typeof fetch = async (input, init) => {
  let attempts = 0;
  const maxAttempts = 3;
  let lastError: any = null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetch(input, init);
      // Retenter automatiquement en cas d'erreur de passerelle temporaire (502, 503, 504)
      if ([502, 503, 504].includes(response.status) && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempts * 300));
        continue;
      }
      return response;
    } catch (err: any) {
      lastError = err;
      if (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempts * 300));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
};

// Instance singleton client Supabase avec persistance de session et tolérance réseau
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "moncv_supabase_auth_session",
      },
      global: {
        fetch: resilientFetch,
        headers: {
          "x-application-name": "moncv-saas",
        },
      },
    })
  : null;
