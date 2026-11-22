import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://otgxrewddogacbsgteyz.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90Z3hyZXdkZG9nYWNic2d0ZXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NjY3ODIsImV4cCI6MjEwNDA0Mjc4Mn0.CiEQ_Q567aEKcyj1hOwnavnvPvrwtchucVrusoUwVlI";

const supabaseUrl = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  FALLBACK_SUPABASE_URL
).trim();

const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  FALLBACK_SUPABASE_ANON_KEY
).trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === "string" &&
    supabaseUrl.length > 0 &&
    supabaseUrl.startsWith("http") &&
    typeof supabaseAnonKey === "string" &&
    supabaseAnonKey.length > 0
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

// Instance singleton client Supabase SSR avec gestion transparente des cookies et tolérance réseau
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: resilientFetch,
      },
    })
  : null;
