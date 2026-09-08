import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { StorageManager, UserSession, RegisteredUser } from "./storage";
import { ResumeData, PlanTier, AccountType, BusinessProfile } from "./types";

export interface CloudAuthResponse {
  success: boolean;
  user?: UserSession;
  message?: string;
  emailVerificationRequired?: boolean;
  email?: string;
  userNotFound?: boolean;
  planTier?: PlanTier;
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
    accountType?: AccountType;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country?: string;
    city?: string;
    password: string;
    business?: BusinessProfile;
    planTier?: PlanTier;
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
      planTier: payload.planTier,
    });

    // 2. Si Supabase Cloud est connecté, synchroniser avec Supabase Auth
    if (this.isAvailable() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: payload.password,
          options: {
            data: {
              account_type: payload.accountType || "candidate",
              plan_tier: payload.planTier || "free",
              first_name: cleanFirstName,
              last_name: cleanLastName,
              phone: payload.phone?.trim(),
              country: payload.country?.trim() || "Côte d'Ivoire",
              city: payload.city?.trim() || "Abidjan",
              company_name: payload.business?.companyName,
              company_type: payload.business?.companyType,
              manager_role: payload.business?.managerRole,
              rccm: payload.business?.rccm,
              tax_id: payload.business?.taxId,
              billing_address: payload.business?.billingAddress,
              whatsapp_phone: payload.business?.whatsappPhone,
              logo_url: payload.business?.logoUrl,
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
            accountType: payload.accountType || "candidate",
            email: cleanEmail,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            phone: payload.phone?.trim(),
            country: payload.country?.trim(),
            city: payload.city?.trim(),
            business: payload.business,
            planTier: localResult.user?.planTier || "free",
            subscription: localResult.user?.subscription,
            createdAt: new Date().toISOString(),
          };
          return {
            success: true,
            emailVerificationRequired: true,
            email: cleanEmail,
            user: userSession,
            message: `Un code de validation à 6 chiffres a été envoyé à ${cleanEmail}. Veuillez vérifier votre boîte de réception ou vos spams.`,
          };
        }

        if (data?.session) {
          const activeUser = StorageManager.getUser();
          const userSession: UserSession = {
            accountType: activeUser?.accountType || payload.accountType || "candidate",
            email: cleanEmail,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            phone: payload.phone?.trim(),
            country: payload.country?.trim(),
            city: payload.city?.trim(),
            business: payload.business,
            token: data.session.access_token,
            planTier: activeUser?.planTier || localResult.user?.planTier || "free",
            subscription: activeUser?.subscription || localResult.user?.subscription,
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
      const activeUser = StorageManager.getUser();
      return { success: true, user: activeUser || (localResult.user as any) };
    }

    return { success: false, message: localResult.message || "Erreur lors de la création du compte." };
  }

  /**
   * Validation d'un code OTP à 6 chiffres reçu par email (Supabase Cloud Auth)
   * Permet d'activer le compte pour une utilisation immédiate sur tout appareil.
   */
  static async verifyEmailOtp(email: string, token: string): Promise<CloudAuthResponse> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanToken = token.trim();

    if (!cleanEmail || !cleanToken) {
      return { success: false, message: "Veuillez renseigner votre adresse email et le code à 6 chiffres." };
    }

    if (this.isAvailable() && supabase) {
      try {
        // 1. Tenter la vérification OTP avec le type 'signup' (par défaut pour inscription)
        let verifyResult = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: "signup",
        });

        // 2. Si échec, tenter avec le type 'email' (supporté selon la configuration GoTrue)
        if (verifyResult.error) {
          const secondAttempt = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: "email",
          });
          if (!secondAttempt.error && secondAttempt.data?.user) {
            verifyResult = secondAttempt;
          }
        }

        if (verifyResult.error) {
          const errMsg = verifyResult.error.message.toLowerCase();
          if (errMsg.includes("expired")) {
            return {
              success: false,
              message: "Ce code à 6 chiffres a expiré. Veuillez cliquer sur 'Renvoyer le code' pour en recevoir un nouveau.",
            };
          }
          if (errMsg.includes("invalid") || errMsg.includes("token")) {
            return {
              success: false,
              message: "Code de validation incorrect. Veuillez vérifier les 6 chiffres reçus dans votre boîte de réception ou spams.",
            };
          }
          return { success: false, message: verifyResult.error.message };
        }

        const authUser = verifyResult.data?.user;
        if (authUser) {
          const meta = authUser.user_metadata || {};

          // Récupération éventuelle du profil PostgreSQL
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();

          const localUsers = StorageManager.getRegisteredUsers();
          const localMatch = localUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);

          const resolvedPlan: PlanTier =
            (meta.plan_tier as PlanTier) ||
            (profile?.plan_tier as PlanTier) ||
            localMatch?.planTier ||
            "free";

          const isEnterprise =
            meta.account_type === "business" ||
            profile?.account_type === "business" ||
            resolvedPlan.startsWith("enterprise") ||
            resolvedPlan === "cyber15" ||
            Boolean(meta.company_name);

          const resolvedAccountType: AccountType = isEnterprise ? "business" : "candidate";

          const resolvedFirstName =
            meta.first_name ||
            profile?.first_name ||
            localMatch?.firstName ||
            cleanEmail.split("@")[0];

          const resolvedLastName =
            meta.last_name ||
            profile?.last_name ||
            localMatch?.lastName ||
            "";

          const resolvedBusiness: BusinessProfile | undefined = isEnterprise
            ? {
                companyName: meta.company_name || profile?.company_name || localMatch?.business?.companyName || "Mon Entreprise",
                companyType: meta.company_type || localMatch?.business?.companyType || "PME / Entreprise",
                managerRole: meta.manager_role || localMatch?.business?.managerRole || "Responsable RH",
                rccm: meta.rccm || localMatch?.business?.rccm || "",
                taxId: meta.tax_id || localMatch?.business?.taxId || "",
                billingAddress: meta.billing_address || localMatch?.business?.billingAddress || `${meta.city || "Abidjan"}, ${meta.country || "Côte d'Ivoire"}`,
                whatsappPhone: meta.whatsapp_phone || meta.phone || localMatch?.business?.whatsappPhone || "",
                logoUrl: meta.logo_url || localMatch?.business?.logoUrl || "",
              }
            : undefined;

          const userSession: UserSession = {
            email: authUser.email || cleanEmail,
            accountType: resolvedAccountType,
            firstName: resolvedFirstName,
            lastName: resolvedLastName,
            phone: meta.phone || profile?.phone || localMatch?.phone,
            country: meta.country || profile?.country || localMatch?.country || "Côte d'Ivoire",
            city: meta.city || profile?.city || localMatch?.city || "Abidjan",
            business: resolvedBusiness,
            planTier: resolvedPlan,
            token: verifyResult.data?.session?.access_token,
            createdAt: authUser.created_at,
          };

          // Sauvegarde locale de la session activée
          StorageManager.setUser(userSession);

          // Synchronisation du registre d'utilisateurs local
          const users = StorageManager.getRegisteredUsers();
          const idx = users.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
          if (idx !== -1) {
            users[idx] = {
              ...users[idx],
              accountType: userSession.accountType,
              planTier: userSession.planTier,
              business: userSession.business,
            };
          } else {
            users.push({
              id: authUser.id,
              email: userSession.email,
              passwordHash: "",
              accountType: userSession.accountType,
              firstName: userSession.firstName || "",
              lastName: userSession.lastName || "",
              phone: userSession.phone,
              country: userSession.country,
              city: userSession.city,
              business: userSession.business,
              planTier: userSession.planTier,
              createdAt: userSession.createdAt || new Date().toISOString(),
            });
          }
          localStorage.setItem("moncv_registered_users", JSON.stringify(users));

          // Mettre à jour public.profiles sur Supabase
          try {
            await supabase.from("profiles").upsert({
              id: authUser.id,
              email: cleanEmail,
              first_name: userSession.firstName,
              last_name: userSession.lastName,
              phone: userSession.phone,
              country: userSession.country,
              city: userSession.city,
              plan_tier: userSession.planTier,
              account_type: userSession.accountType,
              company_name: userSession.business?.companyName,
              updated_at: new Date().toISOString(),
            }, { onConflict: "id" });
          } catch {
            // Tolérance réseau
          }

          // Rapatrier automatiquement les CVs
          this.getResumes(cleanEmail).catch(() => {});

          return {
            success: true,
            user: userSession,
            message: "Votre compte a été validé avec succès !",
          };
        }
      } catch (err: any) {
        console.error("Erreur verifyEmailOtp Supabase:", err);
        return { success: false, message: err?.message || "Erreur de communication lors de la vérification du code." };
      }
    }

    // Repli de secours hors-ligne / développement
    const localUser = StorageManager.getUser();
    if (localUser && localUser.email.toLowerCase().trim() === cleanEmail) {
      return { success: true, user: localUser, message: "Compte activé avec succès !" };
    }

    return { success: false, message: "Impossible de valider le code pour le moment." };
  }

  /**
   * Connexion sécurisée avec repli automatique LocalStorage et tolérance déconnectée
   * Restaure intégralement l'environnement utilisateur sur TOUT nouvel appareil
   */
  static async signIn(email: string, password: string): Promise<CloudAuthResponse> {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Essai de connexion avec Supabase Cloud si connecté
    if (this.isAvailable() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.user) {
          // Récupération des informations de profil
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .maybeSingle();

          const meta = data.user.user_metadata || {};
          const localUsers = StorageManager.getRegisteredUsers();
          const localMatch = localUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);
          const savedSub = StorageManager.getUserSubscription(cleanEmail);

          // Résolution de la formule (priorité Cloud pour fonctionnement multi-appareils)
          const resolvedPlan: PlanTier =
            (meta.plan_tier as PlanTier) ||
            (profile?.plan_tier as PlanTier) ||
            localMatch?.planTier ||
            savedSub?.planTier ||
            "free";

          const isEnterprise =
            meta.account_type === "business" ||
            profile?.account_type === "business" ||
            resolvedPlan.startsWith("enterprise") ||
            resolvedPlan === "cyber15" ||
            Boolean(meta.company_name) ||
            localMatch?.accountType === "business";

          const resolvedAccountType: AccountType = isEnterprise
            ? "business"
            : (meta.account_type || profile?.account_type || localMatch?.accountType || "candidate");

          const resolvedFirstName =
            meta.first_name ||
            profile?.first_name ||
            localMatch?.firstName ||
            (cleanEmail.split("@")[0].charAt(0).toUpperCase() + cleanEmail.split("@")[0].slice(1));

          const resolvedLastName =
            meta.last_name ||
            profile?.last_name ||
            localMatch?.lastName ||
            "";

          // Reconstitution des données Entreprise depuis le Cloud (garantie multi-appareils)
          const resolvedBusiness: BusinessProfile | undefined = isEnterprise
            ? {
                companyName: meta.company_name || profile?.company_name || localMatch?.business?.companyName || "Mon Entreprise",
                companyType: meta.company_type || localMatch?.business?.companyType || "PME / Entreprise",
                managerRole: meta.manager_role || localMatch?.business?.managerRole || "Responsable RH",
                rccm: meta.rccm || localMatch?.business?.rccm || "",
                taxId: meta.tax_id || localMatch?.business?.taxId || "",
                billingAddress: meta.billing_address || localMatch?.business?.billingAddress || `${meta.city || "Abidjan"}, ${meta.country || "Côte d'Ivoire"}`,
                whatsappPhone: meta.whatsapp_phone || meta.phone || localMatch?.business?.whatsappPhone || "",
                logoUrl: meta.logo_url || localMatch?.business?.logoUrl || "",
              }
            : undefined;

          const userSession: UserSession = {
            email: data.user.email || cleanEmail,
            accountType: resolvedAccountType,
            firstName: resolvedFirstName,
            lastName: resolvedLastName,
            phone: meta.phone || profile?.phone || data.user.phone || localMatch?.phone,
            country: meta.country || profile?.country || localMatch?.country || "Côte d'Ivoire",
            city: meta.city || profile?.city || localMatch?.city || "Abidjan",
            business: resolvedBusiness,
            planTier: resolvedPlan,
            subscription: savedSub || localMatch?.subscription,
            token: data.session?.access_token,
            createdAt: data.user.created_at,
          };

          StorageManager.setUser(userSession);
          if (savedSub) {
            StorageManager.saveUserSubscription(cleanEmail, savedSub);
          }

          // Enregistrement sur ce nouvel appareil
          const users = StorageManager.getRegisteredUsers();
          const uIdx = users.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
          if (uIdx !== -1) {
            users[uIdx] = { ...users[uIdx], ...userSession };
          } else {
            users.push({
              id: data.user.id,
              email: userSession.email,
              passwordHash: "",
              accountType: userSession.accountType,
              firstName: userSession.firstName || "",
              lastName: userSession.lastName || "",
              phone: userSession.phone,
              country: userSession.country,
              city: userSession.city,
              business: userSession.business,
              planTier: userSession.planTier,
              createdAt: userSession.createdAt || new Date().toISOString(),
            });
          }
          localStorage.setItem("moncv_registered_users", JSON.stringify(users));

          // Rapatriement automatique des CVs depuis le Cloud
          this.getResumes(cleanEmail).catch(() => {});

          return { success: true, user: userSession };
        }

        // Si l'email n'a pas encore été validé sur Supabase
        if (error && error.message.toLowerCase().includes("email not confirmed")) {
          return {
            success: false,
            emailVerificationRequired: true,
            email: cleanEmail,
            message: "Votre adresse email n'a pas encore été validée. Veuillez saisir le code à 6 chiffres reçu par email.",
          };
        }

        // Si Supabase renvoie identifiants invalides, tester le compte local
        if (error && error.message.toLowerCase().includes("invalid login credentials")) {
          const localCheck = StorageManager.verifyLogin(cleanEmail, password);
          if (localCheck.success && localCheck.user) {
            const activeUser = StorageManager.getUser();
            return { success: true, user: activeUser || (localCheck.user as any) };
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

    const activeUser = StorageManager.getUser();
    return { success: true, user: activeUser || (localResult.user as any) };
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

