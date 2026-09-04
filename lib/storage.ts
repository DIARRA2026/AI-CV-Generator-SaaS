import { initialResumeData } from "./initialData";
import { PlanTier, ResumeData } from "./types";

const STORAGE_KEY = "moncv_resumes_v1";
const ACTIVE_ID_KEY = "moncv_active_id";
const USER_KEY = "moncv_user_session_v1";
const USERS_REGISTRY_KEY = "moncv_registered_users_v1";

export interface RegisteredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  profession?: string;
  passwordHash: string;
  createdAt: string;
}

export interface UserSession {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  profession?: string;
  token?: string;
  planTier?: PlanTier;
  createdAt?: string;
}

export class StorageManager {
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
            id: "user-default",
            firstName: current.firstName || "Jean-Marc",
            lastName: current.lastName || "Kouassi",
            email: current.email.toLowerCase().trim(),
            phone: current.phone,
            passwordHash: remembered?.password || "azerty123",
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
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country?: string;
    city?: string;
    password: string;
  }): { success: boolean; user?: RegisteredUser; message?: string } {
    if (typeof window === "undefined") return { success: false, message: "Environnement non disponible" };
    try {
      const users = this.getRegisteredUsers();
      const normalizedEmail = payload.email.toLowerCase().trim();

      const existing = users.find((u) => u.email.toLowerCase().trim() === normalizedEmail);
      if (existing) {
        return { success: false, message: "Un compte existe déjà avec cette adresse email. Veuillez vous connecter." };
      }

      const newUser: RegisteredUser = {
        id: `user-${Date.now()}`,
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: normalizedEmail,
        phone: payload.phone?.trim() || undefined,
        country: payload.country?.trim() || "Côte d'Ivoire",
        city: payload.city?.trim() || "Abidjan",
        passwordHash: payload.password,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));

      // Créer la session utilisateur active
      this.setUser({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        country: newUser.country,
        city: newUser.city,
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

      if (user.passwordHash !== password) {
        return {
          success: false,
          message: "Mot de passe incorrect. Veuillez vérifier votre saisie ou réinitialiser votre mot de passe.",
        };
      }

      // Connexion réussie : activer la session
      this.setUser({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
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
    // Suppression du cookie de session
    document.cookie = "moncv_auth_token=; path=/; max-age=0; SameSite=Lax";
  }

  // === NIVEAU D'OFFRE & PERMISSIONS (RESPECT DES OFFRES) ===
  static getPlanTier(): PlanTier {
    if (typeof window === "undefined") return "free";
    try {
      const active = this.getActiveResume();
      if (active?.planTier) return active.planTier;
      if (active?.isPremium) return "2500";
      const user = this.getUser();
      if (user?.planTier) return user.planTier;
      return "free";
    } catch {
      return "free";
    }
  }

  static setPlanTier(tier: PlanTier): void {
    if (typeof window === "undefined") return;
    try {
      const active = this.getActiveResume();
      if (active) {
        this.saveActiveResume({
          ...active,
          isPremium: tier !== "free",
          planTier: tier,
        });
      }
      const user = this.getUser();
      if (user) {
        this.setUser({ ...user, planTier: tier });
      }
    } catch (e) {
      console.error("Erreur mise à jour plan tier", e);
    }
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
        // Visiteur non connecté : profil invité
        const guestData = localStorage.getItem("moncv_resumes_guest");
        if (guestData) {
          const parsed = JSON.parse(guestData);
          return Array.isArray(parsed) ? parsed : [initialResumeData];
        }
        return [initialResumeData];
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
      // 2. Nettoyage des doublons/CVs fantômes générés automatiquement (ex: "Nouveau CV 3189")
      const strictlyOwned = parsed.filter((r) => {
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
    const newId = `cv-${Date.now()}`;
    const newResume: ResumeData = {
      ...initialResumeData,
      id: newId,
      userEmail: user?.email || undefined,
      title: user?.firstName ? `CV de ${user.firstName}` : "Mon Nouveau CV",
      personal: {
        ...initialResumeData.personal,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        city: user?.city || initialResumeData.personal.city,
        country: user?.country || initialResumeData.personal.country,
      },
      slug: `cv-${(user?.firstName || "candidat").toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString(),
    };
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
    const base = templateFrom || initialResumeData;
    const newId = `cv-${Date.now()}`;
    const newResume: ResumeData = {
      ...base,
      id: newId,
      userEmail: user?.email || undefined,
      title: title || "Nouveau CV Professionnel",
      personal: {
        ...base.personal,
        firstName: user?.firstName || base.personal.firstName,
        lastName: user?.lastName || base.personal.lastName,
        email: user?.email || base.personal.email,
        phone: user?.phone || base.personal.phone,
        city: user?.city || base.personal.city,
        country: user?.country || base.personal.country,
      },
      slug: (title || "mon-cv")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-") + `-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString(),
    };
    const resumes = this.getResumes();
    resumes.push(newResume);
    this.saveResumes(resumes);
    localStorage.setItem(this.getActiveIdKey(), newId);
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
