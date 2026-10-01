import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * MONCV.AI - MIDDLEWARE SSR D'AUTHENTIFICATION & PROTECTION DES ROUTES
 * Conforme Next.js 14 App Router & Supabase SSR (@supabase/ssr)
 * Développé par INNOVA GROUP
 * 
 * Règles d'accès strictes :
 * 1. Routes protégées (/dashboard, /dashboard/*, /create, /portfolio/edit) :
 *    -> Redirige vers /login si aucune session active n'est détectée.
 * 2. Routes publiques (/, /login, /signup) :
 *    -> Redirige automatiquement vers /dashboard si l'utilisateur est authentifié.
 *    -> La landing page (/) ne doit JAMAIS s'afficher à un utilisateur connecté.
 * 3. En-têtes de sécurité HTTP OWASP injectés sur toutes les réponses.
 */

// Liste des routes protégées
const PROTECTED_PREFIXES = ["/dashboard", "/create", "/portfolio/edit"];

// Liste des routes publiques réservées aux visiteurs non connectés
const PUBLIC_AUTH_ROUTES = ["/", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Création de la réponse de base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. VÉRIFICATION DU SAS DE PRÉVISUALISATION PRIVÉE (Si configuré dans l'environnement)
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

  // 2. INITIALISATION DU CLIENT SUPABASE SSR (@supabase/ssr)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  let user = null;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // IMPORTANT : getUser() valide cryptographiquement le JWT côté serveur Supabase Auth
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user || null;
    } catch {
      user = null;
    }
  }

  // 3. VÉRIFICATION DE SECOURS DES COOKIES DE SESSION MONCV.AI
  if (!user) {
    const moncvToken = request.cookies.get("moncv_auth_token")?.value;
    const sbAccessToken = request.cookies.get("sb-access-token")?.value;
    const hasSbProjectCookie = Array.from(request.cookies.getAll()).some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token") && c.value.length > 20
    );

    if (
      (moncvToken && moncvToken.length >= 5) ||
      (sbAccessToken && sbAccessToken.length >= 20) ||
      hasSbProjectCookie
    ) {
      user = { id: "authenticated-session" } as any;
    }
  }

  const isAuthenticated = Boolean(user);

  // 4. APPLICATION DE LA RÈGLE : La landing page (/) et auth (/login, /signup)
  // ne doivent JAMAIS s'afficher à un utilisateur authentifié -> Redirection /dashboard
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => pathname === route);

  if (isPublicAuthRoute && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    redirectResponse.headers.set("X-Frame-Options", "DENY");
    redirectResponse.headers.set("X-Content-Type-Options", "nosniff");
    return redirectResponse;
  }

  // 5. APPLICATION DE LA RÈGLE : Protection des routes privées (/dashboard, /create, etc.)
  // -> Redirige vers /login si pas de session
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);

    const planParam = request.nextUrl.searchParams.get("plan");
    if (planParam) {
      loginUrl.searchParams.set("plan", planParam);
    }

    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set("X-Frame-Options", "DENY");
    redirectResponse.headers.set("X-Content-Type-Options", "nosniff");
    return redirectResponse;
  }

  // 6. INJECTION DES EN-TÊTES DE SÉCURITÉ OWASP
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg)$).*)",
  ],
};
