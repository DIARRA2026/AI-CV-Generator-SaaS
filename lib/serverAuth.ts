import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyAdminRequest } from "@/lib/adminAuth";

export interface ServerAuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
  role: "superadmin" | "user";
}

export interface ServerAuthResult {
  authenticated: boolean;
  user: ServerAuthUser | null;
  isAdmin: boolean;
}

/**
 * Extrait le token d'accès Supabase depuis les headers ou les cookies de la requête
 */
function extractToken(request: NextRequest): string | null {
  // 1. Authorization Header: Bearer <token>
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  // 2. Cookie d'accès direct standard
  const sbAccessToken = request.cookies.get("sb-access-token")?.value;
  if (sbAccessToken) return sbAccessToken.trim();

  // 3. Cookie moncv_auth_token (si format JWT valide)
  const moncvToken = request.cookies.get("moncv_auth_token")?.value;
  if (moncvToken && moncvToken.split(".").length === 3) {
    return moncvToken.trim();
  }

  // 4. Cookie de projet Supabase avec chunking: sb-<ref>-auth-token ou sb-<ref>-auth-token.0
  const allCookies = request.cookies.getAll();
  const tokenChunks: { index: number; value: string }[] = [];
  let singleTokenCookie: string | null = null;

  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")) {
      const match = cookie.name.match(/-auth-token\.(\d+)$/);
      if (match) {
        tokenChunks.push({ index: parseInt(match[1], 10), value: cookie.value });
      } else if (cookie.name.endsWith("-auth-token")) {
        singleTokenCookie = cookie.value;
      }
    }
  }

  let rawTokenValue = singleTokenCookie;
  if (tokenChunks.length > 0) {
    tokenChunks.sort((a, b) => a.index - b.index);
    rawTokenValue = tokenChunks.map((c) => c.value).join("");
  }

  if (rawTokenValue) {
    // Si la valeur commence par base64- (format @supabase/ssr)
    if (rawTokenValue.startsWith("base64-")) {
      try {
        const decoded = Buffer.from(rawTokenValue.slice(7), "base64").toString("utf-8");
        const parsed = JSON.parse(decoded);
        if (parsed?.access_token) return parsed.access_token;
        if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
      } catch {}
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(rawTokenValue));
      if (typeof parsed === "string") return parsed;
      if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
      if (parsed?.access_token) return parsed.access_token;
    } catch {
      if (rawTokenValue.split(".").length === 3) {
        return rawTokenValue;
      }
    }
  }

  return null;
}

/**
 * Valide cryptographiquement l'identité du demandeur (SuperAdmin ou Utilisateur Supabase Auth)
 */
export async function getServerAuthUser(request: NextRequest): Promise<ServerAuthResult> {
  // 1. Vérification SuperAdmin
  const adminCheck = verifyAdminRequest(request);
  if (adminCheck.authorized && adminCheck.email) {
    return {
      authenticated: true,
      isAdmin: true,
      user: {
        id: "superadmin",
        email: adminCheck.email.toLowerCase().trim(),
        isAdmin: true,
        role: "superadmin",
      },
    };
  }

  // 2. Vérification Supabase Auth via Header Bearer explicite
  const bearerToken = extractToken(request);
  if (bearerToken && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
      if (!error && data?.user && data.user.email) {
        return {
          authenticated: true,
          isAdmin: false,
          user: {
            id: data.user.id,
            email: data.user.email.toLowerCase().trim(),
            isAdmin: false,
            role: "user",
          },
        };
      }
    } catch (e) {
      console.warn("Erreur vérification token Supabase via Bearer:", e);
    }
  }

  // 3. Vérification native de session via les cookies de requête (@supabase/ssr)
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const ssrClient = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      });

      const { data, error } = await ssrClient.auth.getUser();
      if (!error && data?.user && data.user.email) {
        return {
          authenticated: true,
          isAdmin: false,
          user: {
            id: data.user.id,
            email: data.user.email.toLowerCase().trim(),
            isAdmin: false,
            role: "user",
          },
        };
      }
    } catch (ssrErr) {
      console.warn("Erreur vérification session cookie SSR:", ssrErr);
    }
  }

  return {
    authenticated: false,
    isAdmin: false,
    user: null,
  };
}
