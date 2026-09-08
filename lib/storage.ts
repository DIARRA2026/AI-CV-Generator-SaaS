import { initialResumeData, createEmptyResume } from "./initialData";
import { PlanTier, ResumeData, AccountType, BusinessProfile, UserSubscriptionInfo, UserRole } from "./types";

const STORAGE_KEY = "moncv_resumes_v1";
const ACTIVE_ID_KEY = "moncv_active_id";
const USER_KEY = "moncv_user_session_v1";
const USERS_REGISTRY_KEY = "moncv_registered_users_v1";
const PENDING_SUB_KEY = "moncv_pending_subscription_v1";

export interface RegisteredUser {
  id: string;
  accountType?: AccountType;
  role?: UserRole;
  isSuspended?: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  profession?: string;
  business?: BusinessProfile;
  passwordHash: string;
  createdAt: string;
  planTier?: PlanTier;
  subscription?: UserSubscriptionInfo;
}

export interface UserSession {
  accountType?: AccountType;
  role?: UserRole;
  isSuspended?: boolean;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  profession?: string;
  business?: BusinessProfile;
  token?: string;
  planTier?: PlanTier;
  createdAt?: string;
  subscription?: UserSubscriptionInfo;
}

export class StorageManager {
  // === GESTION DES ABONNEMENTS ET FORMULES PÉRENNES ===
  static getSubscriptionKey(email: string): string {
    return `moncv_sub_${email.toLowerCase().trim()}`;
  }

  static getUserSubscription(email?: string): UserSubscriptionInfo | null {
    if (typeof window === "undefined") return null;
    try {
      const targetEmail = email || this.getUser()?.email;
      if (!targetEmail) return null;
      const cleanEmail = targetEmail.toLowerCase().trim();

      // 1. Clé permanente d'abonnement dédiée par email
      const direct = localStorage.getItem(this.getSubscriptionKey(cleanEmail));
      if (direct) {
        return JSON.parse(direct);
      }

      // 2. Recherche dans le registre d'utilisateurs
      const users = this.getRegisteredUsers();
      const matched = users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
      if (matched?.subscription) {
        return matched.subscription;
      }

      // 3. Session active
      const user = this.getUser();
      if (user?.email?.toLowerCase().trim() === cleanEmail && user.subscription) {
        return user.subscription;
      }

      return null;
    } catch {
      return null;
    }
  }

  static saveUserSubscription(email: string, sub: UserSubscriptionInfo): void {
    if (typeof window === "undefined" || !email) return;
    try {
      const cleanEmail = email.toLowerCase().trim();
      const updatedSub: UserSubscriptionInfo = {
        ...sub,
        subscribedAt: sub.subscribedAt || new Date().toISOString(),
        expiresAt: null, // toujours à vie sans expiration
      };

      // 1. Écriture dans la clé permanente inviolable par utilisateur
      localStorage.setItem(this.getSubscriptionKey(cleanEmail), JSON.stringify(updatedSub));

      // 2. Mise à jour dans le registre des utilisateurs inscrits
      const users = this.getRegisteredUsers();
      const userIdx = users.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
      if (userIdx !== -1) {
        users[userIdx].planTier = updatedSub.planTier;
        users[userIdx].subscription = updatedSub;
        if (
          updatedSub.accountType === "business" ||
          updatedSub.planTier.startsWith("enterprise") ||
          updatedSub.planTier === "cyber15"
        ) {
          users[userIdx].accountType = "business";
        }
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
      }

      // 3. Mise à jour de la session active si connectée avec cet email
      const current = this.getUser();
      if (current && current.email.toLowerCase().trim() === cleanEmail) {
        const isEnterprise =
          updatedSub.accountType === "business" ||
          updatedSub.planTier.startsWith("enterprise") ||
          updatedSub.planTier === "cyber15";
        this.setUser({
          ...current,
          planTier: updatedSub.planTier,
          subscription: updatedSub,
          accountType: isEnterprise ? "business" : (current.accountType || "candidate"),
        });
      }

      // 4. Si formule Entreprise, débloquer tous les CVs du compte (100% offerts)
      if (
        updatedSub.accountType === "business" ||
        updatedSub.planTier.startsWith("enterprise") ||
        updatedSub.planTier === "cyber15"
      ) {
        const resumes = this.getResumes();
        if (resumes.length > 0) {
          const unlocked = resumes.map((r) => ({
            ...r,
            isPremium: true,
            planTier: updatedSub.planTier,
          }));
          const userStorageKey = `moncv_resumes_${cleanEmail}`;
          localStorage.setItem(userStorageKey, JSON.stringify(unlocked));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
        }
      }

      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Erreur sauvegarde abonnement utilisateur", e);
    }
  }

  static setPendingSubscription(sub: UserSubscriptionInfo): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PENDING_SUB_KEY, JSON.stringify(sub));
    } catch (e) {
      console.error("Erreur enregistrement abonnement en attente", e);
    }
  }

  static getPendingSubscription(): UserSubscriptionInfo | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(PENDING_SUB_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static clearPendingSubscription(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(PENDING_SUB_KEY);
    } catch {}
  }

  // === GESTION DES COMPTES UTILISATEURS & AUTHENTIFICATION SÉCURISÉE ===
  static getRegisteredUsers(): RegisteredUser[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(USERS_REGISTRY_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Si premier lancement et qu'une session ou des identifiants mémorisés existaient déjà
      const current = this.getUser();
      const remembered = this.getRememberedCreds();
      if (current?.email) {
        const seeded: RegisteredUser[] = [
          {
            id: `user-${Date.now()}`,
            firstName: current.firstName || "",
            lastName: current.lastName || "",
            email: current.email.toLowerCase().trim(),
            phone: current.phone,
            passwordHash: remembered?.password || "",
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(seeded));
        return seeded;
      }
      return [];
    } catch {
      return [];
    }
  }

  static registerUser(payload: {
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
  }): { success: boolean; user?: RegisteredUser; message?: string } {
    if (typeof window === "undefined") return { success: false, message: "Environnement non disponible" };
    try {
      const users = this.getRegisteredUsers();
      const normalizedEmail = payload.email.toLowerCase().trim();

      const existing = users.find((u) => u.email.toLowerCase().trim() === normalizedEmail);
      if (existing) {
        return { success: false, message: "Un compte existe déjà avec cette adresse email. Veuillez vous connecter." };
      }

      // Restauration de tout abonnement préalable ou en attente
      const pendingSub = this.getPendingSubscription();
      const existingSub = this.getUserSubscription(normalizedEmail);
      const appliedSub = pendingSub || existingSub;

      let resolvedPlan: PlanTier = payload.planTier || appliedSub?.planTier || "free";
      let resolvedAccountType: AccountType =
        payload.accountType ||
        (appliedSub?.accountType === "business" ||
        resolvedPlan.startsWith("enterprise") ||
        resolvedPlan === "cyber15"
          ? "business"
          : "candidate");

      const newUser: RegisteredUser = {
        id: `user-${Date.now()}`,
        accountType: resolvedAccountType,
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: normalizedEmail,
        phone: payload.phone?.trim() || undefined,
        country: payload.country?.trim() || "Côte d'Ivoire",
        city: payload.city?.trim() || "Abidjan",
        business: payload.business,
        passwordHash: payload.password,
        createdAt: new Date().toISOString(),
        planTier: resolvedPlan,
        subscription: appliedSub || undefined,
      };

      users.push(newUser);
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));

      if (appliedSub) {
        this.saveUserSubscription(normalizedEmail, appliedSub);
        this.clearPendingSubscription();
      }

      // Créer la session utilisateur active
      this.setUser({
        accountType: newUser.accountType,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        country: newUser.country,
        city: newUser.city,
        business: newUser.business,
        planTier: newUser.planTier || "free",
        subscription: newUser.subscription,
        token: `token-${Date.now()}`,
      });

      return { success: true, user: newUser };
    } catch (e) {
      console.error("Erreur enregistrement utilisateur", e);
      return { success: false, message: "Erreur lors de la création du compte." };
    }
  }

  static verifyLogin(email: string, password: string): { success: boolean; user?: RegisteredUser; message?: string } {
    if (typeof window === "undefined") return { success: false, message: "Environnement non disponible" };
    try {
      const users = this.getRegisteredUsers();
      const normalizedEmail = email.toLowerCase().trim();
      const user = users.find((u) => u.email.toLowerCase().trim() === normalizedEmail);

      if (!user) {
        return {
          success: false,
          message: "Aucun compte associé à cette adresse email. Veuillez créer un compte.",
        };
      }

      if (user.isSuspended) {
        return {
          success: false,
          message: "Ce compte a été suspendu par un administrateur. Veuillez contacter le support MonCV.ai.",
        };
      }

      if (user.passwordHash !== password) {
        return {
          success: false,
          message: "Mot de passe incorrect. Veuillez vérifier votre saisie ou réinitialiser votre mot de passe.",
        };
      }

      // Restauration garantie et inviolable de l'offre souscrite
      const savedSub = this.getUserSubscription(normalizedEmail);
      const pendingSub = this.getPendingSubscription();
      const effectiveSub = pendingSub || savedSub || user.subscription;

      if (pendingSub) {
        this.saveUserSubscription(normalizedEmail, pendingSub);
        this.clearPendingSubscription();
      }

      let restoredPlan: PlanTier = effectiveSub?.planTier || user.planTier || "free";
      const isEnterprise =
        restoredPlan.startsWith("enterprise") ||
        restoredPlan === "cyber15" ||
        user.accountType === "business";

      const restoredAccountType: AccountType = isEnterprise ? "business" : (user.accountType || "candidate");

      // Mise à jour de l'utilisateur dans le registre pour pérenniser l'offre
      user.planTier = restoredPlan;
      user.accountType = restoredAccountType;
      if (effectiveSub) {
        user.subscription = effectiveSub;
      }
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));

      // Connexion réussie : activer la session
      this.setUser({
        accountType: restoredAccountType,
        role: user.role || (normalizedEmail === "admin@moncv.ai" || normalizedEmail === "innova.admin@moncv.ai" || normalizedEmail === "innovagroup225@gmail.com" ? "superadmin" : undefined),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        country: user.country,
        city: user.city,
        business: user.business,
        planTier: restoredPlan,
        subscription: user.subscription,
        token: `token-${Date.now()}`,
      });

      return { success: true, user };
    } catch (e) {
      console.error("Erreur vérification connexion", e);
      return { success: false, message: "Erreur lors de la connexion." };
    }
  }

  static resetPasswordByEmail(email: string, newPassword: string): { success: boolean; message?: string } {
    if (typeof window === "undefined") return { success: false, message: "Environnement non disponible" };
    try {
      const users = this.getRegisteredUsers();
      const normalizedEmail = email.toLowerCase().trim();
      const userIndex = users.findIndex((u) => u.email.toLowerCase().trim() === normalizedEmail);

      if (userIndex === -1) {
        return {
          success: false,
          message: "Aucun compte n'a été trouvé avec cette adresse email.",
        };
      }

      users[userIndex].passwordHash = newPassword;
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));

      // Si les identifiants étaient mémorisés pour cet email, mettre à jour le mot de passe mémorisé
      const remembered = this.getRememberedCreds();
      if (remembered && remembered.email.toLowerCase().trim() === normalizedEmail) {
        this.setRememberedCreds({ email: remembered.email, password: newPassword });
      }

      return {
        success: true,
        message: "Votre mot de passe a été réinitialisé avec succès !",
      };
    } catch (e) {
      console.error("Erreur réinitialisation mot de passe", e);
      return { success: false, message: "Erreur lors de la mise à jour du mot de passe." };
    }
  }

  // === PARAMÈTRES DU COMPTE CLIENT ===
  static updateUserProfile(payload: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    city?: string;
    country?: string;
    profession?: string;
  }): { success: boolean; user?: UserSession; message?: string } {
    if (typeof window === "undefined") return { success: false, message: "Environnement non disponible" };
    try {
      const current = this.getUser();
      if (!current) return { success: false, message: "Aucun utilisateur connecté." };

      const updatedUser: UserSession = {
        ...current,
        firstName: payload.firstName ?? current.firstName,
        lastName: payload.lastName ?? current.lastName,
        phone: payload.phone ?? current.phone,
        city: payload.city ?? current.city,
        country: payload.country ?? current.country,
        profession: payload.profession ?? current.profession,
      };

      this.setUser(updatedUser);

      // Mettre à jour aussi dans USERS_REGISTRY_KEY
      const users = this.getRegisteredUsers();
      const idx = users.findIndex((u) => u.email.toLowerCase().trim() === current.email.toLowerCase().trim());
      if (idx !== -1) {
        users[idx] = {
          ...users[idx],
          firstName: updatedUser.firstName || users[idx].firstName,
          lastName: updatedUser.lastName || users[idx].lastName,
          phone: updatedUser.phone || users[idx].phone,
          city: updatedUser.city || users[idx].city,
          country: updatedUser.country || users[idx].country,
          profession: updatedUser.profession || users[idx].profession,
        };
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      return { success: true, user: updatedUser, message: "Profil mis à jour avec succès !" };
    } catch (e) {
      console.error("Erreur mise à jour profil", e);
      return { success: false, message: "Erreur lors de la sauvegarde du profil." };
    }
  }

  static changePassword(currentPassword: string, newPassword: string): { success: boolean; message: string } {
    if (typeof window === "undefined") return { success: false, message: "Environnement non disponible" };
    try {
      const current = this.getUser();
      if (!current) return { success: false, message: "Aucun utilisateur connecté." };

      const users = this.getRegisteredUsers();
      const userIndex = users.findIndex((u) => u.email.toLowerCase().trim() === current.email.toLowerCase().trim());

      if (userIndex === -1) {
        return { success: false, message: "Compte utilisateur introuvable." };
      }

      // Vérification ancien mot de passe
      if (users[userIndex].passwordHash !== currentPassword) {
        return { success: false, message: "L'ancien mot de passe saisi est incorrect." };
      }

      users[userIndex].passwordHash = newPassword;
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));

      // Mettre à jour identifiants mémorisés si applicable
      const remembered = this.getRememberedCreds();
      if (remembered && remembered.email.toLowerCase().trim() === current.email.toLowerCase().trim()) {
        this.setRememberedCreds({ email: remembered.email, password: newPassword });
      }

      return { success: true, message: "Mot de passe modifié avec succès !" };
    } catch (e) {
      console.error("Erreur changement de mot de passe", e);
      return { success: false, message: "Erreur lors de la modification du mot de passe." };
    }
  }

  static exportUserData(): string {
    if (typeof window === "undefined") return "{}";
    try {
      const user = this.getUser();
      const resumes = this.getResumes();
      const exportObject = {
        app: "MonCV.ai",
        exportDate: new Date().toISOString(),
        user,
        resumes,
      };
      return JSON.stringify(exportObject, null, 2);
    } catch {
      return "{}";
    }
  }

  static deleteAccount(): void {
    if (typeof window === "undefined") return;
    try {
      const user = this.getUser();
      if (user?.email) {
        const normalized = user.email.toLowerCase().trim();
        const users = this.getRegisteredUsers().filter((u) => u.email.toLowerCase().trim() !== normalized);
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
        localStorage.removeItem(`moncv_resumes_${normalized}`);
        localStorage.removeItem(`moncv_active_id_${normalized}`);
      }
      this.logout();
      this.clearRememberedCreds();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error("Erreur suppression compte", e);
    }
  }

  // === ADMINISTRATION & SUPERVISION ===
  static isAdmin(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const user = this.getUser();
      // Si un utilisateur est connecté, on vérifie strictement ses droits administratifs
      if (user) {
        if (user.role === "admin" || user.role === "superadmin") return true;
        const email = user.email?.toLowerCase().trim();
        const isAdminEmail =
          email === "innovagroup225@gmail.com" ||
          email === "admin@moncv.ai" ||
          email === "innova.admin@moncv.ai" ||
          email === "superadmin@moncv.ai";
        // Si l'utilisateur est un client (candidat ou entreprise), il n'est JAMAIS administrateur
        return Boolean(isAdminEmail);
      }
      // Pour les visiteurs et comptes non authentifiés comme admin : toujours false
      return false;
    } catch {
      return false;
    }
  }

  static updateRegisteredUser(email: string, updates: Partial<RegisteredUser>): boolean {
    if (typeof window === "undefined" || !email) return false;
    try {
      const users = this.getRegisteredUsers();
      const normEmail = email.toLowerCase().trim();
      const idx = users.findIndex((u) => u.email.toLowerCase().trim() === normEmail);
      if (idx === -1) return false;

      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));

      // Si l'utilisateur modifié est l'utilisateur connecté, synchroniser sa session
      const current = this.getUser();
      if (current && current.email.toLowerCase().trim() === normEmail) {
        this.setUser({
          ...current,
          ...updates,
          subscription: updates.subscription || current.subscription,
        });
      }
      window.dispatchEvent(new Event("storage"));
      return true;
    } catch (e) {
      console.error("Erreur updateRegisteredUser", e);
      return false;
    }
  }

  static deleteRegisteredUser(email: string): boolean {
    if (typeof window === "undefined" || !email) return false;
    try {
      const users = this.getRegisteredUsers();
      const normEmail = email.toLowerCase().trim();
      const filtered = users.filter((u) => u.email.toLowerCase().trim() !== normEmail);
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(filtered));

      localStorage.removeItem(this.getSubscriptionKey(normEmail));
      localStorage.removeItem(`moncv_resumes_${normEmail}`);
      localStorage.removeItem(`moncv_active_id_${normEmail}`);

      const current = this.getUser();
      if (current && current.email.toLowerCase().trim() === normEmail) {
        this.logout();
      }
      window.dispatchEvent(new Event("storage"));
      return true;
    } catch (e) {
      console.error("Erreur deleteRegisteredUser", e);
      return false;
    }
  }

  // === GESTION DE SESSION UTILISATEUR ===
  static getUser(): UserSession | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static setUser(user: UserSession): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify({ ...user, createdAt: user.createdAt || new Date().toISOString() }));
      // Synchronisation du cookie de session pour le middleware Next.js
      const tokenValue = encodeURIComponent(user.token || `auth_${user.email}`);
      document.cookie = `moncv_auth_token=${tokenValue}; path=/; max-age=2592000; SameSite=Lax`;

      // Si le compte connecté est un compte client, purger formellement tout résidu de session admin
      const isSuperAdmin =
        user.role === "admin" ||
        user.role === "superadmin" ||
        user.email?.toLowerCase().trim() === "innovagroup225@gmail.com" ||
        user.email?.toLowerCase().trim() === "admin@moncv.ai";
      if (!isSuperAdmin) {
        localStorage.removeItem("moncv_admin_session");
        document.cookie = "moncv_admin_token=; path=/; max-age=0; SameSite=Lax";
      }
    } catch (e) {
      console.error("Erreur sauvegarde session", e);
    }
  }

  static isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  static logout(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("moncv_admin_session");
    // Suppression des cookies de session
    document.cookie = "moncv_auth_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "moncv_admin_token=; path=/; max-age=0; SameSite=Lax";
  }

  // === NIVEAU D'OFFRE & PERMISSIONS (RESPECT DES OFFRES) ===
  static getPlanTier(): PlanTier {
    if (typeof window === "undefined") return "free";
    try {
      const user = this.getUser();
      if (user?.planTier && user.planTier !== "free") return user.planTier;
      if (user?.email) {
        const sub = this.getUserSubscription(user.email);
        if (sub?.planTier && sub.planTier !== "free") return sub.planTier;
      }
      const active = this.getActiveResume();
      if (active?.planTier && active.planTier !== "free") return active.planTier;
      if (active?.isPremium) return "2500";
      return "free";
    } catch {
      return "free";
    }
  }

  static setPlanTier(tier: PlanTier, details?: Partial<UserSubscriptionInfo>): void {
    if (typeof window === "undefined") return;
    try {
      const isEnterprise =
        tier === "enterprise30" ||
        tier === "enterprise75" ||
        tier === "enterprise200" ||
        tier === "cyber15";

      let allowedCandidates = 0;
      let defaultAmount = 0;
      if (tier === "enterprise200") {
        allowedCandidates = 200;
        defaultAmount = 100000;
      } else if (tier === "enterprise75") {
        allowedCandidates = 75;
        defaultAmount = 45000;
      } else if (tier === "enterprise30") {
        allowedCandidates = 30;
        defaultAmount = 20000;
      } else if (tier === "cyber15") {
        allowedCandidates = 15;
        defaultAmount = 15000;
      } else if (tier === "5000") {
        allowedCandidates = 4;
        defaultAmount = 5000;
      } else if (tier === "2500") {
        allowedCandidates = 2;
        defaultAmount = 2500;
      } else if (tier === "1500") {
        allowedCandidates = 1;
        defaultAmount = 1500;
      }

      const user = this.getUser();

      const subInfo: UserSubscriptionInfo = {
        planTier: tier,
        amount: details?.amount || defaultAmount,
        currency: details?.currency || "FCFA",
        paymentMethod: details?.paymentMethod || "Mobile Money (Wave / Orange / MTN)",
        phoneNumber: details?.phoneNumber || user?.phone,
        transactionRef: details?.transactionRef || `TRX-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        subscribedAt: new Date().toISOString(),
        expiresAt: null,
        accountType: isEnterprise ? "business" : (details?.accountType || user?.accountType || "candidate"),
        allowedCandidates: details?.allowedCandidates || allowedCandidates,
        companyName: details?.companyName || user?.business?.companyName,
      };

      if (!user?.email) {
        this.setPendingSubscription(subInfo);
      } else {
        this.saveUserSubscription(user.email, subInfo);
      }

      const active = this.getActiveResume();
      if (active) {
        this.saveActiveResume({
          ...active,
          isPremium: tier !== "free",
          planTier: tier,
        });
      }

      if (user) {
        this.setUser({
          ...user,
          planTier: tier,
          subscription: subInfo,
          accountType: isEnterprise ? "business" : (user.accountType || "candidate"),
        });
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error("Erreur mise à jour plan tier", e);
    }
  }

  // === ESPACE ENTREPRISE & GESTION DES RECRUTEURS ===
  static isBusinessAccount(): boolean {
    const user = this.getUser();
    if (!user) return false;
    if (user.accountType === "business") return true;
    const plan = user.planTier || this.getPlanTier();
    return (
      plan === "enterprise30" ||
      plan === "enterprise75" ||
      plan === "enterprise200" ||
      plan === "cyber15"
    );
  }

  /**
   * RÈGLE ENTREPRISE : Dès qu'une formule entreprise est active sur le compte,
   * TOUTES les offres personnelles sont 100% offertes (aucun paiement individuel requis).
   */
  static isPersonalOffersOffered(): boolean {
    return this.isBusinessAccount();
  }

  static getBusinessProfile(): BusinessProfile | null {
    const user = this.getUser();
    return user?.business || null;
  }

  static updateBusinessProfile(businessData: Partial<BusinessProfile>): {
    success: boolean;
    user?: UserSession;
    message?: string;
  } {
    if (typeof window === "undefined")
      return { success: false, message: "Environnement non disponible" };
    try {
      const current = this.getUser();
      if (!current) return { success: false, message: "Aucun utilisateur connecté." };

      const updatedBusiness: BusinessProfile = {
        companyName: businessData.companyName || current.business?.companyName || "Mon Entreprise",
        companyType: businessData.companyType || current.business?.companyType || "PME / Entreprise",
        managerRole: businessData.managerRole || current.business?.managerRole || "Responsable RH",
        rccm: businessData.rccm || current.business?.rccm || "",
        taxId: businessData.taxId || current.business?.taxId || "",
        billingAddress:
          businessData.billingAddress ||
          current.business?.billingAddress ||
          `${current.city || "Abidjan"}, ${current.country || "Côte d'Ivoire"}`,
        whatsappPhone:
          businessData.whatsappPhone ||
          current.business?.whatsappPhone ||
          current.phone ||
          "",
        logoUrl:
          businessData.logoUrl !== undefined
            ? businessData.logoUrl
            : current.business?.logoUrl,
      };

      const updatedUser: UserSession = {
        ...current,
        accountType: "business",
        business: updatedBusiness,
      };

      this.setUser(updatedUser);

      const users = this.getRegisteredUsers();
      const idx = users.findIndex(
        (u) => u.email.toLowerCase().trim() === current.email.toLowerCase().trim()
      );
      if (idx !== -1) {
        users[idx] = {
          ...users[idx],
          accountType: "business",
          business: updatedBusiness,
        };
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      return {
        success: true,
        user: updatedUser,
        message: "Profil entreprise mis à jour avec succès !",
      };
    } catch (e) {
      console.error("Erreur mise à jour profil entreprise", e);
      return { success: false, message: "Erreur lors de la mise à jour entreprise." };
    }
  }

  static getBusinessQuotaInfo(): {
    allowedCount: number;
    usedCount: number;
    remainingCount: number;
    usagePercent: number;
    isExhausted: boolean;
    distinctIdentities: string[];
    planTier: PlanTier;
  } {
    const user = this.getUser();
    const sub = user?.email ? this.getUserSubscription(user.email) : null;
    const active = this.getActiveResume();
    const plan: PlanTier = user?.planTier || sub?.planTier || active?.planTier || "free";

    let allowedCount = 0;
    if (sub?.allowedCandidates && sub.allowedCandidates > 0) {
      allowedCount = sub.allowedCandidates;
    } else if (plan === "enterprise200") allowedCount = 200;
    else if (plan === "enterprise75") allowedCount = 75;
    else if (plan === "enterprise30") allowedCount = 30;
    else if (plan === "cyber15") allowedCount = 15;
    else if (plan === "5000") allowedCount = 4;
    else if (plan === "2500") allowedCount = 2;
    else if (plan === "1500") allowedCount = 1;
    else allowedCount = 0;

    const resumes = this.getResumes();
    const identitiesSet = new Set<string>();

    resumes.forEach((r) => {
      const first = (r.personal?.firstName || "").trim().toLowerCase();
      const last = (r.personal?.lastName || "").trim().toLowerCase();
      if (first || last) {
        identitiesSet.add(`${first}_${last}`);
      }
    });

    const distinctIdentities = Array.from(identitiesSet);
    const usedCount = distinctIdentities.length;
    const remainingCount = Math.max(0, allowedCount - usedCount);
    const usagePercent =
      allowedCount > 0 ? Math.min(100, Math.round((usedCount / allowedCount) * 100)) : 0;
    const isExhausted = allowedCount > 0 && usedCount >= allowedCount;

    return {
      allowedCount,
      usedCount,
      remainingCount,
      usagePercent,
      isExhausted,
      distinctIdentities,
      planTier: plan,
    };
  }

  // === GESTION DE MÉMORISATION DES IDENTIFIANTS (SÉCURITÉ) ===
  static getRememberedCreds(): { email: string; password?: string } | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem("moncv_remembered_creds");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static setRememberedCreds(creds: { email: string; password?: string }): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("moncv_remembered_creds", JSON.stringify(creds));
    } catch (e) {
      console.error("Erreur sauvegarde identifiants mémorisés", e);
    }
  }

  static clearRememberedCreds(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("moncv_remembered_creds");
  }

  // === GESTION DES CVS PAR UTILISATEUR (ISOLATION STRICTE) ===
  static getStorageKey(): string {
    const user = this.getUser();
    if (user?.email) {
      return `moncv_resumes_${user.email.toLowerCase().trim()}`;
    }
    return "moncv_resumes_guest";
  }

  static getActiveIdKey(): string {
    const user = this.getUser();
    if (user?.email) {
      return `moncv_active_id_${user.email.toLowerCase().trim()}`;
    }
    return "moncv_active_id_guest";
  }

  // Registre public pour consultation par les recruteurs (/c/[slug])
  static registerPublicResume(resume: ResumeData): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("moncv_public_resumes_registry");
      const list: ResumeData[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((r) => r.id === resume.id || r.slug === resume.slug);
      if (idx >= 0) {
        list[idx] = resume;
      } else {
        list.push(resume);
      }
      localStorage.setItem("moncv_public_resumes_registry", JSON.stringify(list));
    } catch (e) {
      console.error("Erreur enregistrement public", e);
    }
  }

  static getResumeBySlug(slug: string): ResumeData | null {
    if (typeof window === "undefined") return null;
    // 1. Chercher dans les CVs de l'utilisateur courant
    const myResumes = this.getResumes();
    const foundInMy = myResumes.find((r) => r.slug === slug || r.id === slug);
    if (foundInMy) return foundInMy;

    // 2. Chercher dans le registre public
    try {
      const raw = localStorage.getItem("moncv_public_resumes_registry");
      if (raw) {
        const list: ResumeData[] = JSON.parse(raw);
        const found = list.find((r) => r.slug === slug || r.id === slug);
        if (found) return found;
      }
    } catch {}

    // 3. Fallback ancien stockage global
    try {
      const oldRaw = localStorage.getItem(STORAGE_KEY);
      if (oldRaw) {
        const oldList: ResumeData[] = JSON.parse(oldRaw);
        const foundOld = oldList.find((r) => r.slug === slug || r.id === slug);
        if (foundOld) return foundOld;
      }
    } catch {}

    return null;
  }

  static getResumes(): ResumeData[] {
    if (typeof window === "undefined") return [];
    try {
      const user = this.getUser();
      if (!user || !user.email) {
        // Visiteur non connecté : profil invité propre
        const guestData = localStorage.getItem("moncv_resumes_guest");
        if (guestData) {
          const parsed = JSON.parse(guestData);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(
              (r) => r.id !== "cv-jean-kouassi-01" && r.personal?.email !== "jean.kouassi@email.com"
            );
            if (cleaned.length > 0) return cleaned;
          }
        }
        const cleanGuest = createEmptyResume(null);
        localStorage.setItem("moncv_resumes_guest", JSON.stringify([cleanGuest]));
        return [cleanGuest];
      }

      const userEmail = user.email.toLowerCase().trim();
      const key = `moncv_resumes_${userEmail}`;
      const data = localStorage.getItem(key);
      if (!data) {
        return [];
      }
      const parsed: ResumeData[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];

      // FILTRAGE STRICT & CLOISONNEMENT PAR COMPTE UTILISATEUR :
      // 1. Un utilisateur ne voit STRICTEMENT QUE les CVs qui lui appartiennent
      // 2. Nettoyage des anciennes données fictives de démo (Jean Kouassi)
      // 3. Nettoyage des doublons/CVs fantômes générés automatiquement (ex: "Nouveau CV 3189")
      const strictlyOwned = parsed.filter((r) => {
        // Éliminer toute trace résiduelle de mock Jean Kouassi
        if (r.id === "cv-jean-kouassi-01" || r.personal?.email === "jean.kouassi@email.com") {
          return false;
        }

        // Le CV doit être rattaché à l'adresse email du compte connecté
        const belongsToUser =
          (r.userEmail && r.userEmail.toLowerCase().trim() === userEmail) ||
          (r.personal?.email && r.personal.email.toLowerCase().trim() === userEmail);

        if (!belongsToUser) return false;

        // Nettoyer les CVs fantômes non désirés créés par le clic navbar "Nouveau CV [0-9]{4}"
        // si l'utilisateur possède déjà son CV principal personnalisé
        const isPhantomAutoGenerated = /^Nouveau CV \d{4}$/.test(r.title);
        const hasRealPersonalResume = parsed.some(
          (other) => other.id !== r.id && !/^Nouveau CV \d{4}$/.test(other.title)
        );
        if (isPhantomAutoGenerated && hasRealPersonalResume) {
          return false;
        }

        return true;
      });

      // Synchroniser le stockage si un CV fantôme ou externe a été nettoyé
      if (strictlyOwned.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(strictlyOwned));
      }

      return strictlyOwned;
    } catch {
      return [];
    }
  }

  static saveResumes(resumes: ResumeData[]): void {
    if (typeof window === "undefined") return;
    try {
      const user = this.getUser();
      if (!user?.email) {
        localStorage.setItem("moncv_resumes_guest", JSON.stringify(resumes));
        return;
      }
      const userEmail = user.email.toLowerCase().trim();
      const key = `moncv_resumes_${userEmail}`;
      
      // Assurer que chaque CV enregistré porte explicitement l'email de l'utilisateur propriétaire
      const strictlyOwned = resumes.map((r) => ({
        ...r,
        userEmail: userEmail,
      }));
      
      localStorage.setItem(key, JSON.stringify(strictlyOwned));
    } catch (e) {
      console.error("Erreur sauvegarde LocalStorage", e);
    }
  }

  static createDefaultUserResume(user: UserSession | null): ResumeData {
    const newResume = createEmptyResume(user);
    this.saveActiveResume(newResume);
    return newResume;
  }

  static getActiveResume(): ResumeData {
    if (typeof window === "undefined") return initialResumeData;
    const resumes = this.getResumes();
    const activeIdKey = this.getActiveIdKey();
    const activeId = localStorage.getItem(activeIdKey);
    const found = resumes.find((r) => r.id === activeId);
    if (found) return found;
    if (resumes.length > 0) return resumes[0];

    const user = this.getUser();
    return this.createDefaultUserResume(user);
  }

  static saveActiveResume(resume: ResumeData): void {
    if (typeof window === "undefined") return;
    const user = this.getUser();
    const resumeWithOwner: ResumeData = {
      ...resume,
      userEmail: user?.email || resume.userEmail,
      updatedAt: new Date().toISOString(),
    };

    const resumes = this.getResumes();
    const updated = resumes.map((r) =>
      r.id === resumeWithOwner.id ? resumeWithOwner : r
    );
    if (!resumes.some((r) => r.id === resumeWithOwner.id)) {
      updated.push(resumeWithOwner);
    }
    this.saveResumes(updated);
    localStorage.setItem(this.getActiveIdKey(), resumeWithOwner.id);
    this.registerPublicResume(resumeWithOwner);
  }

  static createNewResume(title: string, templateFrom?: ResumeData): ResumeData {
    const user = this.getUser();
    let newResume: ResumeData;

    if (templateFrom) {
      // Duplication basée sur un CV existant
      const newId = `cv-${Date.now()}`;
      newResume = {
        ...templateFrom,
        id: newId,
        userEmail: user?.email || templateFrom.userEmail,
        title: title || `${templateFrom.title} (Copie)`,
        slug: `${(title || templateFrom.title || "mon-cv")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")}-${Date.now().toString().slice(-4)}`,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Nouveau CV 100% vierge
      newResume = createEmptyResume(user);
      if (title) {
        newResume.title = title;
        newResume.slug = `${title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")}-${Date.now().toString().slice(-4)}`;
      }
    }

    const resumes = this.getResumes();
    resumes.push(newResume);
    this.saveResumes(resumes);
    localStorage.setItem(this.getActiveIdKey(), newResume.id);
    this.registerPublicResume(newResume);
    return newResume;
  }

  static deleteResume(id: string): ResumeData[] {
    const resumes = this.getResumes().filter((r) => r.id !== id);
    this.saveResumes(resumes);
    if (resumes.length > 0) {
      localStorage.setItem(this.getActiveIdKey(), resumes[0].id);
    } else {
      localStorage.removeItem(this.getActiveIdKey());
    }
    return resumes;
  }
}
