import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * ROUTE HANDLER : CONFIRMATION D'EMAIL & RÉCUPÉRATION SUPABASE
 * GET /auth/confirm?token_hash=...&type=signup|recovery&next=/
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const token = searchParams.get("token");
  const code = searchParams.get("code");
  const type = (searchParams.get("type") as EmailOtpType) || "signup";
  const defaultNext = type === "recovery" ? "/auth/reset-password" : "/create";
  const rawNext = searchParams.get("next");
  const next = !rawNext || rawNext === "/" ? defaultNext : rawNext;


  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Gestion du flux PKCE avec code d'autorisation
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const dest = type === "recovery" ? "/auth/reset-password" : `${next}?confirmed=true`;
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }

    // 2. Gestion avec token_hash
    if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        const dest = type === "recovery" ? "/auth/reset-password" : `${next}?confirmed=true`;
        return NextResponse.redirect(new URL(dest, request.url));
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
          const dest = type === "recovery" ? "/auth/reset-password" : `${next}?confirmed=true`;
          return NextResponse.redirect(new URL(dest, request.url));
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
