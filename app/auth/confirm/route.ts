import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

/**
 * ROUTE HANDLER : CONFIRMATION D'EMAIL & RÉCUPÉRATION SUPABASE SSR
 * GET /auth/confirm?token_hash=...&type=signup|recovery&next=/dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const token = searchParams.get("token");
  const code = searchParams.get("code");
  const type = (searchParams.get("type") as EmailOtpType) || "signup";
  const defaultNext = type === "recovery" ? "/auth/reset-password" : "/dashboard";
  const rawNext = searchParams.get("next");
  const next = !rawNext || rawNext === "/" ? defaultNext : rawNext;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const dest = type === "recovery" ? "/auth/reset-password" : `${next}?confirmed=true`;
    let response = NextResponse.redirect(new URL(dest, request.url));

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // 1. Gestion du flux PKCE avec code d'autorisation
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }
    }

    // 2. Gestion avec token_hash
    if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        return response;
      }
    } else if (token) {
      // 3. Gestion avec token brut + email
      const email = searchParams.get("email");
      if (email) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token,
          email: email.toLowerCase().trim(),
        });

        if (!error) {
          return response;
        }
      }
    }
  }

  // Redirection d'erreur si le token est invalide ou expiré
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/auth/reset-password?auth_error=invalid_token", request.url));
  }
  return NextResponse.redirect(new URL(`${next}?auth_error=invalid_token`, request.url));
}
