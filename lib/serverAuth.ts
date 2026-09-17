import { NextRequest } from "next/server";
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

  // 2. Cookie d'accès standard
  const sbAccessToken = request.cookies.get("sb-access-token")?.value;
  if (sbAccessToken) return sbAccessToken.trim();

  // 3. Cookie moncv_auth_token (si format JWT valide)
  const moncvToken = request.cookies.get("moncv_auth_token")?.value;
  if (moncvToken && moncvToken.split(".").length === 3) {
    return moncvToken.trim();
  }

  // 4. Cookie de projet Supabase: sb-<ref>-auth-token
  const allCookies = request.cookies.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookie.value));
        if (typeof parsed === "string") {
          return parsed;
        }
        if (Array.isArray(parsed) && typeof parsed[0] === "string") {
          return parsed[0];
        }
        if (parsed?.access_token) {
          return parsed.access_token;
        }
      } catch {
        if (cookie.value.split(".").length === 3) {
          return cookie.value;
        }
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

  // 2. Vérification Supabase Auth JWT
  const token = extractToken(request);
  if (token && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
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
      console.warn("Erreur vérification token Supabase:", e);
    }
  }

  return {
    authenticated: false,
    isAdmin: false,
    user: null,
  };
}
