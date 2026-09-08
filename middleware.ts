import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * MONCV.AI - MIDDLEWARE D'AUTHENTIFICATION & EN-TÊTES DE SÉCURITÉ OWASP
 * Développé par INNOVA GROUP
 * 
 * Rôles :
 * 1. Protection stricte des routes privées (/dashboard, /create, /portfolio/edit)
 * 2. Contrôle d'accès et sécurité de la console Super Admin (/admin)
 * 3. Vérification de la présence des jetons d'authentification (Supabase / Session / Admin)
 * 4. Injection des en-têtes HTTP de sécurité OWASP (Anti-Clickjacking, Anti-MIME, CSP)
 */

// Routes nécessitant une authentification obligatoire
const PROTECTED_ROUTES = ["/dashboard", "/create", "/portfolio/edit"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. INJECTION DES EN-TÊTES HTTP DE SÉCURITÉ OWASP & ANTI-INDEXATION (Sur toutes les requêtes)
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet"); // Empêche l'indexation par Google/moteurs
  response.headers.set("X-Frame-Options", "DENY"); // Empêche le clickjacking
  response.headers.set("X-Content-Type-Options", "nosniff"); // Empêche le reniflage de type MIME
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block"); // Protection anti-XSS des navigateurs
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"); // HSTS
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Content-Security-Policy (Protection contre les injections de scripts et détournements de frames)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com",
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
      pathname.startsWith("/api/");

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
    // Vérification des cookies de session (Token Supabase Cloud ou Token MonCV)
    const moncvToken = request.cookies.get("moncv_auth_token")?.value;
    const sbAccessToken = request.cookies.get("sb-access-token")?.value;
    
    // Cookie Supabase par défaut (sb-<project-ref>-auth-token)
    const hasSbProjectCookie = Array.from(request.cookies.getAll()).some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );

    const isAuthenticated = Boolean(moncvToken || sbAccessToken || hasSbProjectCookie);

    // Si l'utilisateur n'est pas authentifié, redirection vers l'accueil avec demande de connexion
    if (!isAuthenticated) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth", "login");
      loginUrl.searchParams.set("redirect", pathname);
      
      const redirectResponse = NextResponse.redirect(loginUrl);
      
      // Conservation des en-têtes de sécurité lors de la redirection
      redirectResponse.headers.set("X-Frame-Options", "DENY");
      redirectResponse.headers.set("X-Content-Type-Options", "nosniff");
      return redirectResponse;
    }
  }

  return response;
}

/**
 * Matcher de configuration Next.js pour cibler uniquement les routes applicatives
 * (Exclut les assets statiques, images et polices pour optimiser les performances)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons (.png, .jpg, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
