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
   * Sauvegarde ou synchronisation d'un CV vers le cloud Supabase (Full-Stack)
   */
  static async syncResumeToCloud(
    resume: ResumeData,
    explicitEmail?: string
  ): Promise<{ success: boolean; syncedAt?: string; error?: string }> {
    // 1. Sauvegarde locale instantanée à latence zéro
    StorageManager.saveActiveResume(resume);

    const currentUser = StorageManager.getUser();
    const resolvedEmail = (
      explicitEmail ||
      currentUser?.email ||
      resume.userEmail ||
      resume.personal?.email ||
      ""
    ).toLowerCase().trim();

    const nowIso = new Date().toISOString();
    const resumeWithMetadata: ResumeData = {
      ...resume,
      userEmail: resolvedEmail || resume.userEmail,
      updatedAt: nowIso,
    };

    // 2. Appel de la route API serveur Next.js pour persistance PostgreSQL Supabase
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume: resumeWithMetadata,
            userEmail: resolvedEmail,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            return { success: true, syncedAt: result.syncedAt || nowIso };
          }
        }
      }
    } catch (apiErr) {
      console.warn("API /api/resumes indisponible, tentative directe via Supabase Client:", apiErr);
    }

    // 3. Repli direct via le client Supabase
    if (this.isAvailable() && supabase) {
      try {
        let userId: string | null = null;
        if (resolvedEmail) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", resolvedEmail)
            .maybeSingle();
          if (profile?.id) {
            userId = profile.id;
          }
        }

        const { error } = await supabase.from("resumes").upsert(
          {
            id: resumeWithMetadata.id,
            user_id: userId,
            user_email: resolvedEmail || null,
            title: resumeWithMetadata.title || resumeWithMetadata.personal?.title || "Mon CV Professionnel",
            slug: resumeWithMetadata.slug,
            resume_data: resumeWithMetadata,
            ats_score: 85,
            is_public: true,
            updated_at: nowIso,
          },
          { onConflict: "id" }
        );

        if (error) {
          console.warn("Avertissement synchronisation directe Supabase:", error.message);
          return { success: false, error: error.message };
        }

        return { success: true, syncedAt: nowIso };
      } catch (err: any) {
        return { success: false, error: err?.message };
      }
    }

    return { success: true, syncedAt: nowIso };
  }

  /**
   * Récupération d'un CV par son slug ou son ID depuis le Cloud Supabase
   * (indispensable pour les recruteurs consultant un portfolio /c/[slug] sur un autre appareil)
   */
  static async getResumeBySlug(slug: string): Promise<ResumeData | null> {
    if (!slug) return null;

    // 1. Interroger la route API serveur
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/resumes/${encodeURIComponent(slug)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.resume) {
            StorageManager.registerPublicResume(data.resume);
            return data.resume as ResumeData;
          }
        }
      }
    } catch (e) {
      console.warn("Erreur fetch API slug, repli direct:", e);
    }

    // 2. Repli direct Supabase Client
    if (this.isAvailable() && supabase) {
      try {
        const { data, error } = await supabase
          .from("resumes")
          .select("resume_data")
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .maybeSingle();

        if (!error && data?.resume_data) {
          const loaded = data.resume_data as ResumeData;
          StorageManager.registerPublicResume(loaded);
          return loaded;
        }
      } catch (e) {
        console.warn("Erreur Supabase getResumeBySlug:", e);
      }
    }

    // 3. Repli LocalStorage
    return StorageManager.getResumeBySlug(slug);
  }

  /**
   * Récupération des CVs depuis le cloud Supabase avec fusion locale intelligente
   */
  static async getResumes(userEmail?: string): Promise<ResumeData[]> {
    const email = (userEmail || StorageManager.getUser()?.email || "").toLowerCase().trim();

    if (this.isAvailable() && supabase && email) {
      try {
        const { data, error } = await supabase
          .from("resumes")
          .select("resume_data")
          .eq("user_email", email)
          .order("updated_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const cloudResumes = data.map((item) => item.resume_data as ResumeData);
          
          // Fusionner avec le local pour ne jamais perdre de travail hors-ligne
          const localResumes = StorageManager.getResumes();
          const mergedMap = new Map<string, ResumeData>();

          cloudResumes.forEach((cr) => mergedMap.set(cr.id, cr));
          localResumes.forEach((lr) => {
            if (!mergedMap.has(lr.id)) {
              mergedMap.set(lr.id, lr);
            }
          });

          const finalList = Array.from(mergedMap.values());
          StorageManager.saveResumes(finalList);
          return finalList;
        }
      } catch (e) {
        console.warn("Repli vers le stockage local");
      }
    }
    return StorageManager.getResumes();
  }

  /**
   * Suppression d'un CV (Cloud + Local)
   */
  static async deleteResume(id: string): Promise<ResumeData[]> {
    if (this.isAvailable() && supabase) {
      try {
        await supabase.from("resumes").delete().eq("id", id);
        if (typeof window !== "undefined") {
          fetch(`/api/resumes?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
        }
      } catch (e) {
        console.warn("Erreur suppression cloud CV:", e);
      }
    }
    return StorageManager.deleteResume(id);
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

