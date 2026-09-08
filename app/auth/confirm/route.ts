import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * ROUTE HANDLER : CONFIRMATION D'EMAIL SUPABASE
 * GET /auth/confirm?token_hash=...&type=signup&next=/
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const token = searchParams.get("token");
  const type = (searchParams.get("type") as EmailOtpType) || "signup";
  const next = searchParams.get("next") ?? "/";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && (token_hash || token)) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        return NextResponse.redirect(new URL(`${next}?confirmed=true`, request.url));
      }
    } else if (token) {
      const email = searchParams.get("email");
      if (email) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token,
          email: email.toLowerCase().trim(),
        });

        if (!error) {
          return NextResponse.redirect(new URL(`${next}?confirmed=true`, request.url));
        }
      }
    }
  }

  // Redirection d'erreur si le token est invalide ou manquant
  return NextResponse.redirect(new URL(`${next}?auth_error=invalid_token`, request.url));
}
