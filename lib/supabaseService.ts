import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { StorageManager, UserSession, RegisteredUser } from "./storage";
import { ResumeData, PlanTier } from "./types";

export interface CloudAuthResponse {
  success: boolean;
  user?: UserSession;
  message?: string;
  emailVerificationRequired?: boolean;
  userNotFound?: boolean;
}

export class SupabaseService {
  /**
   * Vérifie si Supabase est actuellement configuré et connecté
   */
  static isAvailable(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  }

  /**
   * Inscription d'un nouvel utilisateur avec gestion de vérification email
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
    const cleanEmail = payload.email.toLowerCase().trim();
    const cleanFirstName = payload.firstName.trim();
    const cleanLastName = payload.lastName.trim();

    // 1. Toujours enregistrer immédiatement dans le registre local sécurisé
    const localResult = StorageManager.registerUser({
      ...payload,
      email: cleanEmail,
      firstName: cleanFirstName,
      lastName: cleanLastName,
    });

    // 2. Si Supabase Cloud est connecté, synchroniser avec Supabase Auth
    if (this.isAvailable() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: payload.password,
          options: {
            data: {
              first_name: cleanFirstName,
              last_name: cleanLastName,
              phone: payload.phone?.trim(),
              country: payload.country?.trim() || "Côte d'Ivoire",
              city: payload.city?.trim() || "Abidjan",
            },
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes("already registered")) {
            return {
              success: false,
              message: "Un compte existe déjà avec cette adresse email. Veuillez vous connecter.",
            };
          }
        }

        // Si la vérification par email est exigée par Supabase
        if (!data?.session && data?.user) {
          const userSession = StorageManager.getUser() || {
            email: cleanEmail,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            phone: payload.phone?.trim(),
            country: payload.country?.trim(),
            city: payload.city?.trim(),
            planTier: "free" as PlanTier,
            createdAt: new Date().toISOString(),
          };
          return {
            success: true,
            emailVerificationRequired: true,
            user: userSession,
            message: `Un email de confirmation a été envoyé à ${cleanEmail}. Veuillez vérifier votre boîte de réception ou vos spams.`,
          };
        }

        if (data?.session) {
          const userSession: UserSession = {
            email: cleanEmail,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            phone: payload.phone?.trim(),
            country: payload.country?.trim(),
            city: payload.city?.trim(),
            token: data.session.access_token,
            planTier: "free",
            createdAt: new Date().toISOString(),
          };
          StorageManager.setUser(userSession);
          return { success: true, user: userSession };
        }
      } catch (err: any) {
        console.warn("Erreur d'inscription Supabase, utilisation du repli local:", err);
      }
    }

    if (localResult.success && localResult.user) {
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

    return { success: false, message: localResult.message || "Erreur lors de la création du compte." };
  }

  /**
   * Connexion utilisateur avec détection intelligente (Cloud Supabase + LocalStorage)
   */
  static async signIn(email: string, password: string): Promise<CloudAuthResponse> {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Si Supabase Cloud est connecté
    if (this.isAvailable() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (!error && data?.user) {
          // Récupération des informations de profil
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          const resolvedFirstName =
            profile?.first_name ||
            data.user.user_metadata?.first_name ||
            (cleanEmail.split("@")[0].charAt(0).toUpperCase() + cleanEmail.split("@")[0].slice(1));

          const userSession: UserSession = {
            email: data.user.email || cleanEmail,
            firstName: resolvedFirstName,
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
        }

        // Si l'email n'a pas encore été validé sur Supabase
        if (error && error.message.toLowerCase().includes("email not confirmed")) {
          // Vérifier si le compte existe en local pour permettre l'accès direct sans blocage
          const localCheck = StorageManager.verifyLogin(cleanEmail, password);
          if (localCheck.success && localCheck.user) {
            const session: UserSession = {
              email: localCheck.user.email,
              firstName: localCheck.user.firstName,
              lastName: localCheck.user.lastName,
              phone: localCheck.user.phone,
              city: localCheck.user.city,
              country: localCheck.user.country,
              token: `local-${Date.now()}`,
              planTier: "free",
              createdAt: localCheck.user.createdAt,
            };
            StorageManager.setUser(session);
            return { success: true, user: session };
          }

          return {
            success: false,
            emailVerificationRequired: true,
            message: "Votre adresse email est en attente de confirmation. Veuillez cliquer sur le lien reçu par email.",
          };
        }

        // Si Supabase renvoie identifiants invalides, tester le compte local
        if (error && error.message.toLowerCase().includes("invalid login credentials")) {
          const localCheck = StorageManager.verifyLogin(cleanEmail, password);
          if (localCheck.success && localCheck.user) {
            const session: UserSession = {
              email: localCheck.user.email,
              firstName: localCheck.user.firstName,
              lastName: localCheck.user.lastName,
              phone: localCheck.user.phone,
              city: localCheck.user.city,
              country: localCheck.user.country,
              token: `local-${Date.now()}`,
              planTier: "free",
              createdAt: localCheck.user.createdAt,
            };
            StorageManager.setUser(session);
            return { success: true, user: session };
          }

          // Si le mot de passe est faux mais l'email existe
          const registeredUsers = StorageManager.getRegisteredUsers();
          const emailExists = registeredUsers.some((u) => u.email.toLowerCase().trim() === cleanEmail);
          if (!emailExists) {
            return {
              success: false,
              userNotFound: true,
              message: `Aucun compte n'a été trouvé avec l'adresse ${cleanEmail}. Souhaitez-vous créer votre compte ?`,
            };
          }

          return {
            success: false,
            message: "Mot de passe incorrect. Veuillez vérifier votre saisie ou réinitialiser votre mot de passe.",
          };
        }
      } catch (err: any) {
        console.warn("Erreur Supabase signIn, repli sur local:", err);
      }
    }

    // 2. Mode LocalStorage Fallback
    const localResult = StorageManager.verifyLogin(cleanEmail, password);
    if (!localResult.success || !localResult.user) {
      const registeredUsers = StorageManager.getRegisteredUsers();
      const emailExists = registeredUsers.some((u) => u.email.toLowerCase().trim() === cleanEmail);
      if (!emailExists) {
        return {
          success: false,
          userNotFound: true,
          message: `Aucun compte n'a été trouvé avec l'adresse ${cleanEmail}. Souhaitez-vous créer votre compte ?`,
        };
      }
      return { success: false, message: localResult.message || "Mot de passe incorrect." };
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

  /**
   * Renvoi d'un email de confirmation
   */
  static async resendConfirmationEmail(email: string): Promise<{ success: boolean; message: string }> {
    if (this.isAvailable() && supabase) {
      try {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: email.toLowerCase().trim(),
        });
        if (error) {
          return { success: false, message: error.message };
        }
        return { success: true, message: "Un nouveau lien d'activation a été envoyé. Vérifiez vos spams." };
      } catch (err: any) {
        return { success: false, message: err?.message || "Erreur lors du renvoi." };
      }
    }
    return { success: false, message: "Service Supabase non connecté." };
  }
}
