import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { StorageManager, UserSession, RegisteredUser } from "./storage";
import { ResumeData, PlanTier, AccountType, BusinessProfile, UserSubscriptionInfo } from "./types";

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

        // Mise à jour de l'ID centralisé Supabase dans le registre local
        const registeredId = data?.user?.id || localResult.user?.id;
        if (data?.user?.id) {
          const users = StorageManager.getRegisteredUsers();
          const uIdx = users.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
          if (uIdx !== -1) {
            users[uIdx].id = data.user.id;
            StorageManager.saveRegisteredUsers(users);
          }
        }

        // Si la vérification par email est exigée par Supabase
        if (!data?.session && data?.user) {
          const userSession: UserSession = {
            ...(StorageManager.getUser() || {}),
            id: data.user.id,
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
          StorageManager.setUser(userSession);

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
            id: data.user?.id || localResult.user?.id || undefined,
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

          let userSub = localMatch?.subscription || StorageManager.getUserSubscription(cleanEmail);
          if (!userSub && resolvedPlan !== "free") {
            let allowedCandidates = 0;
            let defaultAmount = 0;
            if (resolvedPlan === "enterprise200") { allowedCandidates = 200; defaultAmount = 100000; }
            else if (resolvedPlan === "enterprise75") { allowedCandidates = 75; defaultAmount = 45000; }
            else if (resolvedPlan === "enterprise30") { allowedCandidates = 30; defaultAmount = 20000; }
            else if (resolvedPlan === "cyber15") { allowedCandidates = 15; defaultAmount = 15000; }
            else if (resolvedPlan === "5000") { allowedCandidates = 4; defaultAmount = 5000; }
            else if (resolvedPlan === "2500") { allowedCandidates = 2; defaultAmount = 2500; }
            else if (resolvedPlan === "1500") { allowedCandidates = 1; defaultAmount = 1500; }

            userSub = {
              planTier: resolvedPlan,
              amount: defaultAmount,
              currency: "FCFA",
              paymentMethod: "Mobile Money",
              phoneNumber: meta.phone || profile?.phone || localMatch?.phone,
              transactionRef: `OTP_VERIFIED_${authUser.id.slice(0, 8)}`,
              subscribedAt: authUser.created_at || new Date().toISOString(),
              expiresAt: null,
              accountType: resolvedAccountType,
              allowedCandidates,
              companyName: resolvedBusiness?.companyName,
            };
            StorageManager.saveUserSubscription(cleanEmail, userSub);
          }

          const userSession: UserSession = {
            id: authUser.id,
            email: authUser.email || cleanEmail,
            accountType: resolvedAccountType,
            firstName: resolvedFirstName,
            lastName: resolvedLastName,
            phone: meta.phone || profile?.phone || localMatch?.phone,
            country: meta.country || profile?.country || localMatch?.country || "Côte d'Ivoire",
            city: meta.city || profile?.city || localMatch?.city || "Abidjan",
            business: resolvedBusiness,
            planTier: resolvedPlan,
            subscription: userSub || undefined,
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
              id: authUser.id,
              accountType: userSession.accountType,
              planTier: userSession.planTier,
              business: userSession.business,
              subscription: userSub || users[idx].subscription,
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
              subscription: userSub || undefined,
              createdAt: userSession.createdAt || new Date().toISOString(),
            });
          }
          StorageManager.saveRegisteredUsers(users);

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

          // Résolution de la formule (priorité Cloud inviolable pour fonctionnement multi-appareils)
          const isPaidPlan = (p: any): boolean =>
            typeof p === "string" && p !== "free" && p.trim().length > 0;

          const candidatePlans = [
            meta.plan_tier,
            profile?.plan_tier,
            localMatch?.planTier,
            savedSub?.planTier,
          ];
          const foundPaid = candidatePlans.find(isPaidPlan) as PlanTier | undefined;
          const resolvedPlan: PlanTier =
            foundPaid || (meta.plan_tier as PlanTier) || (profile?.plan_tier as PlanTier) || "free";

          const isEnterprise =
            meta.account_type === "business" ||
            profile?.account_type === "business" ||
            resolvedPlan.startsWith("enterprise") ||
            resolvedPlan === "cyber15" ||
            Boolean(meta.company_name) ||
            Boolean(profile?.company_name) ||
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

          // Restauration de l'abonnement permanent pour tout appareil distant
          let cloudSub: UserSubscriptionInfo | null = savedSub || localMatch?.subscription || null;
          if (!cloudSub && resolvedPlan !== "free") {
            let allowedCandidates = 0;
            let defaultAmount = 0;
            if (resolvedPlan === "enterprise200") { allowedCandidates = 200; defaultAmount = 100000; }
            else if (resolvedPlan === "enterprise75") { allowedCandidates = 75; defaultAmount = 45000; }
            else if (resolvedPlan === "enterprise30") { allowedCandidates = 30; defaultAmount = 20000; }
            else if (resolvedPlan === "cyber15") { allowedCandidates = 15; defaultAmount = 15000; }
            else if (resolvedPlan === "5000") { allowedCandidates = 4; defaultAmount = 5000; }
            else if (resolvedPlan === "2500") { allowedCandidates = 2; defaultAmount = 2500; }
            else if (resolvedPlan === "1500") { allowedCandidates = 1; defaultAmount = 1500; }

            cloudSub = {
              planTier: resolvedPlan,
              amount: defaultAmount,
              currency: "FCFA",
              paymentMethod: "Mobile Money",
              phoneNumber: meta.phone || profile?.phone,
              transactionRef: `CLOUD_RESTORED_${data.user.id.slice(0, 8)}`,
              subscribedAt: data.user.created_at || new Date().toISOString(),
              expiresAt: null,
              accountType: resolvedAccountType,
              allowedCandidates,
              companyName: resolvedBusiness?.companyName,
            };
          }

          if (cloudSub) {
            StorageManager.saveUserSubscription(cleanEmail, cloudSub);
          }

          const userSession: UserSession = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            accountType: resolvedAccountType,
            firstName: resolvedFirstName,
            lastName: resolvedLastName,
            phone: meta.phone || profile?.phone || data.user.phone || localMatch?.phone,
            country: meta.country || profile?.country || localMatch?.country || "Côte d'Ivoire",
            city: meta.city || profile?.city || localMatch?.city || "Abidjan",
            business: resolvedBusiness,
            planTier: resolvedPlan,
            subscription: cloudSub || undefined,
            token: data.session?.access_token,
            createdAt: data.user.created_at,
          };

          StorageManager.setUser(userSession);

          // Enregistrement unifié sur ce nouvel appareil
          const users = StorageManager.getRegisteredUsers();
          const uIdx = users.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
          if (uIdx !== -1) {
            users[uIdx] = {
              ...users[uIdx],
              id: data.user.id,
              passwordHash: password || users[uIdx].passwordHash,
              ...userSession,
            };
          } else {
            users.push({
              id: data.user.id,
              email: userSession.email,
              passwordHash: password,
              accountType: userSession.accountType,
              firstName: userSession.firstName || "",
              lastName: userSession.lastName || "",
              phone: userSession.phone,
              country: userSession.country,
              city: userSession.city,
              business: userSession.business,
              planTier: userSession.planTier,
              subscription: cloudSub || undefined,
              createdAt: userSession.createdAt || new Date().toISOString(),
            });
          }
          StorageManager.saveRegisteredUsers(users);

          // Mettre à jour public.profiles si désynchronisé
          if (profile?.plan_tier !== resolvedPlan || profile?.account_type !== resolvedAccountType) {
            supabase
              .from("profiles")
              .update({
                plan_tier: resolvedPlan,
                account_type: resolvedAccountType,
                company_name: resolvedBusiness?.companyName,
                updated_at: new Date().toISOString(),
              })
              .eq("id", data.user.id)
              .then(() => {}, () => {});
          }

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
   * Supporte la recherche par user_id ET par user_email pour garantir la cohérence multi-appareils
   */
  static async getResumes(userEmail?: string): Promise<ResumeData[]> {
    const currentUser = StorageManager.getUser();
    const email = (userEmail || currentUser?.email || "").toLowerCase().trim();

    if (this.isAvailable() && supabase && (email || currentUser?.id)) {
      try {
        let query = supabase.from("resumes").select("resume_data");
        if (currentUser?.id && /^[0-9a-f-]{36}$/i.test(currentUser.id)) {
          if (email) {
            query = query.or(`user_id.eq.${currentUser.id},user_email.eq.${email}`);
          } else {
            query = query.eq("user_id", currentUser.id);
          }
        } else if (email) {
          query = query.eq("user_email", email);
        }

        const { data, error } = await query.order("updated_at", { ascending: false });

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
        console.warn("Repli vers le stockage local:", e);
      }
    }
    return StorageManager.getResumes();
  }

  /**
   * Synchronisation immédiate d'un abonnement ou pack avec le Cloud Supabase
   * Met à jour à la fois Auth UserMetadata, public.profiles et enregistre la transaction.
   */
  static async syncSubscriptionToCloud(
    tier: PlanTier,
    details?: Partial<import("./types").UserSubscriptionInfo>
  ): Promise<boolean> {
    const user = StorageManager.getUser();
    const cleanEmail = (user?.email || "").toLowerCase().trim();
    const isEnterprise =
      tier === "enterprise30" ||
      tier === "enterprise75" ||
      tier === "enterprise200" ||
      tier === "cyber15";

    let defaultAmount = 0;
    let allowedCandidates = 0;
    if (tier === "enterprise200") { allowedCandidates = 200; defaultAmount = 100000; }
    else if (tier === "enterprise75") { allowedCandidates = 75; defaultAmount = 45000; }
    else if (tier === "enterprise30") { allowedCandidates = 30; defaultAmount = 20000; }
    else if (tier === "cyber15") { allowedCandidates = 15; defaultAmount = 15000; }
    else if (tier === "5000") { allowedCandidates = 4; defaultAmount = 5000; }
    else if (tier === "2500") { allowedCandidates = 2; defaultAmount = 2500; }
    else if (tier === "1500") { allowedCandidates = 1; defaultAmount = 1500; }

    const amount = details?.amount || defaultAmount;
    const resolvedAccountType: AccountType = isEnterprise ? "business" : (user?.accountType || "candidate");
    const companyName = details?.companyName || user?.business?.companyName;

    // 1. Appel API serveur Next.js pour persistance garantie
    try {
      if (typeof window !== "undefined" && cleanEmail) {
        await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            userId: user?.id,
            planTier: tier,
            amount,
            currency: details?.currency || "FCFA",
            paymentMethod: details?.paymentMethod || "Mobile Money",
            phoneNumber: details?.phoneNumber || user?.phone,
            transactionRef: details?.transactionRef || `TRX_${Date.now()}`,
            accountType: resolvedAccountType,
            companyName,
          }),
        });
      }
    } catch (e) {
      console.warn("Erreur route API subscriptions:", e);
    }

    // 2. Mise à jour directe via Supabase Client
    if (this.isAvailable() && supabase) {
      try {
        // A. Mise à jour de l'utilisateur connecté Supabase Auth
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await supabase.auth.updateUser({
            data: {
              plan_tier: tier,
              account_type: resolvedAccountType,
              company_name: companyName,
              phone: details?.phoneNumber || user?.phone || authData.user.user_metadata?.phone,
            },
          });
        }

        // B. Mise à jour directe de public.profiles
        const updatePayload: any = {
          plan_tier: tier,
          account_type: resolvedAccountType,
          updated_at: new Date().toISOString(),
        };
        if (companyName) updatePayload.company_name = companyName;
        if (details?.phoneNumber || user?.phone) {
          updatePayload.phone = details?.phoneNumber || user?.phone;
        }

        if (user?.id && /^[0-9a-f-]{36}$/i.test(user.id)) {
          await supabase.from("profiles").update(updatePayload).eq("id", user.id);
        } else if (cleanEmail) {
          await supabase.from("profiles").update(updatePayload).eq("email", cleanEmail);
        }

        // C. Insertion de la transaction
        let provider = "wave";
        const pLower = (details?.paymentMethod || "").toLowerCase();
        if (pLower.includes("orange")) provider = "orange";
        else if (pLower.includes("mtn")) provider = "mtn";
        else if (pLower.includes("moov")) provider = "moov";
        else if (pLower.includes("card") || pLower.includes("carte") || pLower.includes("visa")) provider = "card";
        else if (pLower.includes("stripe")) provider = "stripe";
        else if (pLower.includes("paystack")) provider = "paystack";

        const txPayload: any = {
          plan_tier: tier,
          amount_xof: amount,
          provider,
          phone_number: details?.phoneNumber || user?.phone,
          reference_code: details?.transactionRef || `TRX_${Date.now()}`,
          status: "completed",
        };
        if (user?.id && /^[0-9a-f-]{36}$/i.test(user.id)) {
          txPayload.user_id = user.id;
        }
        await supabase.from("transactions").insert(txPayload);
      } catch (err) {
        console.warn("Erreur Supabase syncSubscriptionToCloud:", err);
      }
    }

    return true;
  }

  /**
   * Rafraîchit l'état de la session utilisateur depuis Supabase Cloud
   * Utilisé au chargement du Dashboard pour synchroniser instantanément les modifications effectuées sur un autre appareil
   */
  static async refreshSessionFromCloud(): Promise<boolean> {
    const localUser = StorageManager.getUser();
    if (!localUser?.email) return false;
    const cleanEmail = localUser.email.toLowerCase().trim();

    if (this.isAvailable() && supabase) {
      try {
        let authUser: any = null;
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          authUser = authData.user;
        }

        let profile: any = null;
        if (authUser?.id) {
          const { data: p } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();
          profile = p;
        } else {
          const { data: p } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", cleanEmail)
            .maybeSingle();
          profile = p;
        }

        const meta = authUser?.user_metadata || {};
        const isPaid = (tier?: string) => typeof tier === "string" && tier !== "free" && tier.trim().length > 0;

        const candidatePlans = [meta.plan_tier, profile?.plan_tier, localUser.planTier];
        const foundPaid = candidatePlans.find(isPaid) as PlanTier | undefined;
        const resolvedPlan: PlanTier = foundPaid || localUser.planTier || "free";

        const isEnterprise =
          meta.account_type === "business" ||
          profile?.account_type === "business" ||
          localUser.accountType === "business" ||
          resolvedPlan.startsWith("enterprise") ||
          resolvedPlan === "cyber15" ||
          Boolean(meta.company_name) ||
          Boolean(profile?.company_name) ||
          Boolean(localUser.business?.companyName);

        const resolvedAccountType: AccountType = isEnterprise ? "business" : "candidate";

        const companyName =
          meta.company_name ||
          profile?.company_name ||
          localUser.business?.companyName ||
          "Mon Entreprise";

        const resolvedBusiness: BusinessProfile | undefined = isEnterprise
          ? {
              companyName,
              companyType: meta.company_type || profile?.company_type || localUser.business?.companyType || "PME / Entreprise",
              managerRole: meta.manager_role || profile?.manager_role || localUser.business?.managerRole || "Responsable RH",
              rccm: meta.rccm || profile?.rccm || localUser.business?.rccm || "",
              taxId: meta.tax_id || profile?.tax_id || localUser.business?.taxId || "",
              billingAddress: meta.billing_address || profile?.billing_address || localUser.business?.billingAddress || "",
              whatsappPhone: meta.whatsapp_phone || meta.phone || profile?.phone || localUser.business?.whatsappPhone || localUser.phone || "",
              logoUrl: meta.logo_url || profile?.logo_url || localUser.business?.logoUrl || "",
            }
          : undefined;

        const updatedSession: UserSession = {
          ...localUser,
          id: authUser?.id || profile?.id || localUser.id,
          accountType: resolvedAccountType,
          planTier: resolvedPlan,
          business: resolvedBusiness,
          firstName: meta.first_name || profile?.first_name || localUser.firstName,
          lastName: meta.last_name || profile?.last_name || localUser.lastName,
          phone: meta.phone || profile?.phone || localUser.phone,
          city: meta.city || profile?.city || localUser.city,
          country: meta.country || profile?.country || localUser.country,
        };

        StorageManager.setUser(updatedSession);

        if (resolvedPlan !== "free") {
          let allowedCandidates = 0;
          let defaultAmount = 0;
          if (resolvedPlan === "enterprise200") { allowedCandidates = 200; defaultAmount = 100000; }
          else if (resolvedPlan === "enterprise75") { allowedCandidates = 75; defaultAmount = 45000; }
          else if (resolvedPlan === "enterprise30") { allowedCandidates = 30; defaultAmount = 20000; }
          else if (resolvedPlan === "cyber15") { allowedCandidates = 15; defaultAmount = 15000; }
          else if (resolvedPlan === "5000") { allowedCandidates = 4; defaultAmount = 5000; }
          else if (resolvedPlan === "2500") { allowedCandidates = 2; defaultAmount = 2500; }
          else if (resolvedPlan === "1500") { allowedCandidates = 1; defaultAmount = 1500; }

          const restoredSub: import("./types").UserSubscriptionInfo = {
            planTier: resolvedPlan,
            amount: defaultAmount,
            currency: "FCFA",
            paymentMethod: "Mobile Money",
            phoneNumber: updatedSession.phone,
            transactionRef: `REFRESH_RESTORED_${(updatedSession.id || "").slice(0, 8)}`,
            subscribedAt: profile?.created_at || new Date().toISOString(),
            expiresAt: null,
            accountType: resolvedAccountType,
            allowedCandidates,
            companyName: resolvedBusiness?.companyName,
          };
          StorageManager.saveUserSubscription(cleanEmail, restoredSub);
        }

        const users = StorageManager.getRegisteredUsers();
        const uIdx = users.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
        if (uIdx !== -1) {
          users[uIdx] = { ...users[uIdx], ...updatedSession };
          StorageManager.saveRegisteredUsers(users);
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("storage"));
        }
        return true;
      } catch (err) {
        console.warn("Erreur refreshSessionFromCloud:", err);
      }
    }
    return false;
  }

  /**
   * Met à jour le profil entreprise dans Supabase Cloud
   */
  static async updateBusinessProfile(business: Partial<BusinessProfile>): Promise<boolean> {
    const user = StorageManager.getUser();
    if (!user?.email) return false;

    if (this.isAvailable() && supabase) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await supabase.auth.updateUser({
            data: {
              company_name: business.companyName || authData.user.user_metadata?.company_name,
              company_type: business.companyType || authData.user.user_metadata?.company_type,
              manager_role: business.managerRole || authData.user.user_metadata?.manager_role,
              rccm: business.rccm || authData.user.user_metadata?.rccm,
              tax_id: business.taxId || authData.user.user_metadata?.tax_id,
              billing_address: business.billingAddress || authData.user.user_metadata?.billing_address,
              whatsapp_phone: business.whatsappPhone || authData.user.user_metadata?.whatsapp_phone,
              logo_url: business.logoUrl !== undefined ? business.logoUrl : authData.user.user_metadata?.logo_url,
            },
          });
        }

        const updatePayload: any = { updated_at: new Date().toISOString() };
        if (business.companyName) updatePayload.company_name = business.companyName;

        if (user.id && /^[0-9a-f-]{36}$/i.test(user.id)) {
          await supabase.from("profiles").update(updatePayload).eq("id", user.id);
        } else {
          await supabase.from("profiles").update(updatePayload).eq("email", user.email.toLowerCase().trim());
        }
        return true;
      } catch (e) {
        console.warn("Erreur updateBusinessProfile Supabase:", e);
      }
    }
    return false;
  }

  /**
   * Met à jour le profil candidat dans Supabase Cloud
   */
  static async updateUserProfile(payload: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    city?: string;
    country?: string;
    profession?: string;
  }): Promise<boolean> {
    const user = StorageManager.getUser();
    if (!user?.email) return false;

    if (this.isAvailable() && supabase) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await supabase.auth.updateUser({
            data: {
              first_name: payload.firstName || authData.user.user_metadata?.first_name,
              last_name: payload.lastName || authData.user.user_metadata?.last_name,
              phone: payload.phone || authData.user.user_metadata?.phone,
              city: payload.city || authData.user.user_metadata?.city,
              country: payload.country || authData.user.user_metadata?.country,
              profession: payload.profession || authData.user.user_metadata?.profession,
            },
          });
        }

        const updatePayload: any = {
          updated_at: new Date().toISOString(),
          first_name: payload.firstName,
          last_name: payload.lastName,
          phone: payload.phone,
          city: payload.city,
          country: payload.country,
          profession: payload.profession,
        };

        if (user.id && /^[0-9a-f-]{36}$/i.test(user.id)) {
          await supabase.from("profiles").update(updatePayload).eq("id", user.id);
        } else {
          await supabase.from("profiles").update(updatePayload).eq("email", user.email.toLowerCase().trim());
        }
        return true;
      } catch (e) {
        console.warn("Erreur updateUserProfile Supabase:", e);
      }
    }
    return false;
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

