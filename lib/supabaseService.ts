import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { StorageManager, UserSession, RegisteredUser } from "./storage";
import { ResumeData, PlanTier } from "./types";

export interface CloudAuthResponse {
  success: boolean;
  user?: UserSession;
  message?: string;
}

export class SupabaseService {
  /**
   * Vérifie si Supabase est actuellement configuré et connecté
   */
  static isAvailable(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  static async signUp(payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country?: string;
    city?: string;
    password: string;
  }): Promise<CloudAuthResponse> {
    // Si Supabase Cloud est connecté
    if (this.isAvailable() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: payload.email.toLowerCase().trim(),
          password: payload.password,
          options: {
            data: {
              first_name: payload.firstName.trim(),
              last_name: payload.lastName.trim(),
              phone: payload.phone?.trim(),
              country: payload.country?.trim() || "Côte d'Ivoire",
              city: payload.city?.trim() || "Abidjan",
            },
          },
        });

        if (error) {
          return { success: false, message: error.message };
        }

        const userSession: UserSession = {
          email: payload.email.toLowerCase().trim(),
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          phone: payload.phone?.trim(),
          country: payload.country?.trim(),
          city: payload.city?.trim(),
          token: data.session?.access_token,
          planTier: "free",
          createdAt: new Date().toISOString(),
        };

        // Enregistrer la session locale
        StorageManager.setUser(userSession);
        return { success: true, user: userSession };
      } catch (err: any) {
        return { success: false, message: err?.message || "Erreur de connexion cloud" };
      }
    }

    // Mode LocalStorage Fallback (si Supabase n'a pas encore de clés renseignées)
    const localResult = StorageManager.registerUser(payload);
    if (!localResult.success || !localResult.user) {
      return { success: false, message: localResult.message };
    }

    const session: UserSession = {
      email: localResult.user.email,
      firstName: localResult.user.firstName,
      lastName: localResult.user.lastName,
      phone: localResult.user.phone,
      city: localResult.user.city,
      country: localResult.user.country,
      token: `local-${Date.now()}`,
      planTier: "free",
      createdAt: localResult.user.createdAt,
    };
    StorageManager.setUser(session);
    return { success: true, user: session };
  }

  /**
   * Connexion utilisateur
   */
  static async signIn(email: string, password: string): Promise<CloudAuthResponse> {
    // Si Supabase Cloud est connecté
    if (this.isAvailable() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password: password,
        });

        if (error) {
          return { success: false, message: error.message };
        }

        // Récupération des informations de profil
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        const userSession: UserSession = {
          email: data.user.email || email,
          firstName: profile?.first_name || data.user.user_metadata?.first_name || "Candidat",
          lastName: profile?.last_name || data.user.user_metadata?.last_name || "",
          phone: profile?.phone || data.user.user_metadata?.phone,
          country: profile?.country || data.user.user_metadata?.country,
          city: profile?.city || data.user.user_metadata?.city,
          planTier: (profile?.plan_tier as PlanTier) || "free",
          token: data.session?.access_token,
          createdAt: data.user.created_at,
        };

        StorageManager.setUser(userSession);
        return { success: true, user: userSession };
      } catch (err: any) {
        return { success: false, message: err?.message || "Erreur de connexion" };
      }
    }

    // Mode LocalStorage Fallback
    const localResult = StorageManager.verifyLogin(email, password);
    if (!localResult.success || !localResult.user) {
      return { success: false, message: localResult.message };
    }

    const session: UserSession = {
      email: localResult.user.email,
      firstName: localResult.user.firstName,
      lastName: localResult.user.lastName,
      phone: localResult.user.phone,
      city: localResult.user.city,
      country: localResult.user.country,
      token: `local-${Date.now()}`,
      planTier: "free",
      createdAt: localResult.user.createdAt,
    };
    StorageManager.setUser(session);
    return { success: true, user: session };
  }

  /**
   * Déconnexion
   */
  static async signOut(): Promise<void> {
    if (this.isAvailable() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Erreur déconnexion Supabase:", e);
      }
    }
    StorageManager.logout();
  }

  /**
   * Sauvegarde ou synchronisation d'un CV vers le cloud Supabase
   */
  static async syncResumeToCloud(resume: ResumeData): Promise<{ success: boolean; error?: string }> {
    // Toujours sauvegarder localement
    StorageManager.saveActiveResume(resume);

    if (this.isAvailable() && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        const { error } = await supabase.from("resumes").upsert(
          {
            id: resume.id,
            user_id: userId || null,
            title: resume.personal.title || "Mon CV Professionnel",
            slug: resume.slug,
            resume_data: resume,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        if (error) {
          console.warn("Avertissement synchronisation cloud:", error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message };
      }
    }
    return { success: true };
  }

  /**
   * Récupération des CVs depuis le cloud Supabase avec repli local
   */
  static async getResumes(): Promise<ResumeData[]> {
    if (this.isAvailable() && supabase) {
      try {
        const { data, error } = await supabase
          .from("resumes")
          .select("resume_data")
          .order("updated_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((item) => item.resume_data as ResumeData);
        }
      } catch (e) {
        console.warn("Repli vers le stockage local");
      }
    }
    return StorageManager.getResumes();
  }
}
