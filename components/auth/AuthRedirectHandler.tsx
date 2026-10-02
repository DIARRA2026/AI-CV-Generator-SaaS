"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/**
 * Composant global de gestion des redirections d'authentification Supabase.
 * Détecte les flux de récupération de mot de passe (PASSWORD_RECOVERY)
 * arrivant sur n'importe quelle page (ex: page d'accueil avec hash #access_token=...&type=recovery)
 * et redirige automatiquement vers /auth/reset-password.
 */
export function AuthRedirectHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Si on est déjà sur la page de réinitialisation, ne pas rediriger
    if (pathname === "/auth/reset-password") return;

    // 1. Vérification du fragment d'URL (Hash fragment pour Implicit flow)
    const hash = window.location.hash;
    if (hash && (hash.includes("type=recovery") || hash.includes("access_token="))) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const type = params.get("type");
      if (type === "recovery") {
        window.location.replace("/auth/reset-password" + hash);
        return;
      }
    }

    // 2. Vérification des paramètres de recherche (Search params pour PKCE flow)
    const search = window.location.search;
    if (search && search.includes("type=recovery")) {
      window.location.replace("/auth/reset-password" + search + (hash || ""));
      return;
    }

    // 3. Écouteur officiel Supabase pour l'événement PASSWORD_RECOVERY
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          const currentHash = window.location.hash;
          const currentSearch = window.location.search;
          window.location.replace(
            "/auth/reset-password" + (currentSearch || "") + (currentHash || "")
          );
        } else if (event === "SIGNED_OUT") {
          if (typeof window !== "undefined" && window.location.pathname !== "/") {
            window.location.href = "/";
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [pathname, router]);

  return null;
}
