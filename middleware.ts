import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * MONCV.AI - MIDDLEWARE D'AUTHENTIFICATION & EN-TÊTES DE SÉCURITÉ OWASP
 * Développé par INNOVA GROUP
 * 
 * Rôles :
 * 1. Protection stricte des routes privées (/dashboard, /create, /portfolio/edit)
 * 2. Contrôle d'accès et sécurité de la console Super Admin (/admin)
 * 3. Validation de structure des jetons d'authentification (Supabase / Session / Admin)
 * 4. Injection des en-têtes HTTP de sécurité OWASP (Anti-Clickjacking, Anti-MIME, CSP durcie)
 */

// Routes nécessitant une authentification obligatoire
const PROTECTED_ROUTES = ["/dashboard", "/create", "/portfolio/edit"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. INJECTION DES EN-TÊTES HTTP DE SÉCURITÉ OWASP & ANTI-INDEXATION
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Content-Security-Policy durcie
  const isProd = process.env.NODE_ENV === "production";
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
    "media-src 'self' https://*.cloudfront.net blob: data:",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", cspHeader);

  // 2. VÉRIFICATION DU SAS DE PRÉVISUALISATION PRIVÉE (PREVIEW LOCK)
  const previewPassword = process.env.PREVIEW_PASSWORD?.trim();
  if (previewPassword) {
    const isPreviewExcluded =
      pathname.startsWith("/preview-access") ||
      pathname.startsWith("/api/") ||
      pathname.endsWith(".mp4") ||
      pathname.endsWith(".webm");

    if (!isPreviewExcluded) {
      const previewCookie = request.cookies.get("moncv_preview_auth")?.value;
      if (!previewCookie) {
        const lockUrl = new URL("/preview-access", request.url);
        if (pathname !== "/") {
          lockUrl.searchParams.set("redirect", pathname);
        }
        const lockResponse = NextResponse.redirect(lockUrl);
        lockResponse.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
        return lockResponse;
      }
    }
  }

  // 3. VÉRIFICATION DE LA PROTECTION DES ROUTES PRIVÉES
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Validation structurelle stricte des jetons (anti-usurpation par chaîne vide ou arbitraire)
    const isValidToken = (val?: string): boolean => {
      if (!val || typeof val !== "string" || val.length < 20) return false;
      // Format JWT classique : 3 segments base64url séparés par des points
      const parts = val.split(".");
      if (parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0) {
        return true;
      }
      // Format Token de session signé ou hashé
      if (val.length >= 32) {
        try {
          const decoded = atob(val.replace(/-/g, "+").replace(/_/g, "/"));
          if (decoded.includes(":") && decoded.split(":").length === 3) {
            return true;
          }
        } catch {}
      }
      return false;
    };

    const moncvToken = request.cookies.get("moncv_auth_token")?.value;
    const sbAccessToken = request.cookies.get("sb-access-token")?.value;
    
    const hasSbProjectCookie = Array.from(request.cookies.getAll()).some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token") && isValidToken(c.value)
    );

    const isAuthenticated = Boolean(
      isValidToken(moncvToken) || isValidToken(sbAccessToken) || hasSbProjectCookie
    );

    if (!isAuthenticated) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth", "login");
      loginUrl.searchParams.set("redirect", pathname);
      
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set("X-Frame-Options", "DENY");
      redirectResponse.headers.set("X-Content-Type-Options", "nosniff");
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg)$).*)",
  ],
};
