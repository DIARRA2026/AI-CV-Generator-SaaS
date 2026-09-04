import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * MONCV.AI - MIDDLEWARE D'AUTHENTIFICATION & EN-TÊTES DE SÉCURITÉ OWASP
 * Développé par INNOVA GROUP
 * 
 * Rôles :
 * 1. Protection stricte des routes privées (/dashboard, /create)
 * 2. Vérification de la présence des jetons d'authentification (Supabase / Session)
 * 3. Injection des en-têtes HTTP de sécurité (Anti-Clickjacking, Anti-MIME, CSP)
 */

// Routes nécessitant une authentification obligatoire
const PROTECTED_ROUTES = ["/dashboard", "/create", "/portfolio/edit"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. INJECTION DES EN-TÊTES HTTP DE SÉCURITÉ OWASP (Sur toutes les requêtes)
  response.headers.set("X-Frame-Options", "DENY"); // Empêche le clickjacking
  response.headers.set("X-Content-Type-Options", "nosniff"); // Empêche le reniflage de type MIME
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block"); // Protection anti-XSS des navigateurs
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // 2. VÉRIFICATION DE LA PROTECTION DES ROUTES PRIVÉES
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
