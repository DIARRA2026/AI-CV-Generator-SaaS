"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  FileText,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Key,
  Lock,
  Unlock,
  Building,
  Crown,
  Database,
  Wrench,
  Download,
  Trash2,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Server,
  HardDrive,
  Cpu,
  LogOut,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Eye,
  EyeOff,
  Shield,
  CreditCard,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { StorageManager, RegisteredUser, UserSession } from "@/lib/storage";
import {
  PlanTier,
  UserRole,
  AdminAuditLog,
  SystemDiagnosticCheck,
  SystemMetricSummary,
  TransactionRecord,
} from "@/lib/types";
import { AdminService } from "@/lib/adminService";
import { AdminWaveClaimsTab } from "@/components/admin/AdminWaveClaimsTab";

export default function AdminConsolePage() {
  const router = useRouter();

  // État d'authentification
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("admin@moncv.ai");
  const [authError, setAuthError] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [lockoutCountdown, setLockoutCountdown] = useState<number>(0);

  // Décompte de verrouillage anti-brute-force
  useEffect(() => {
    if (lockoutCountdown > 0) {
      const timer = setInterval(() => {
        setLockoutCountdown((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            setRemainingAttempts(3);
            setAuthError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutCountdown]);

  // Onglet actif
  const [activeTab, setActiveTab] = useState<
    "overview" | "claims" | "users" | "business" | "transactions" | "diagnostics" | "maintenance"
  >("overview");

  // Données
  const [metrics, setMetrics] = useState<SystemMetricSummary | null>(null);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnosticCheck[]>([]);
  const [diagLoading, setDiagLoading] = useState<boolean>(false);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Données Transactions & Paiements LigdiCash
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [txStats, setTxStats] = useState<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalVolumeXof: number;
  }>({ total: 0, completed: 0, pending: 0, failed: 0, totalVolumeXof: 0 });
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [txSearch, setTxSearch] = useState<string>("");
  const [txStatusFilter, setTxStatusFilter] = useState<string>("all");
  const [txPlanFilter, setTxPlanFilter] = useState<string>("all");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [reverifyingRef, setReverifyingRef] = useState<string | null>(null);

  // Modal Validation Manuelle
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);
  const [manualRef, setManualRef] = useState<string>("");
  const [manualEmail, setManualEmail] = useState<string>("");
  const [manualPlan, setManualPlan] = useState<PlanTier>("2500");

  // Filtres utilisateurs
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Modal d'action utilisateur
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [editPlanModalOpen, setEditPlanModalOpen] = useState<boolean>(false);
  const [selectedPlanTier, setSelectedPlanTier] = useState<PlanTier>("free");
  const [resetPassModalOpen, setResetPassModalOpen] = useState<boolean>(false);
  const [newPasswordInput, setNewPasswordInput] = useState<string>("");

  // Horloge en direct
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
        }) + " GMT"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Vérifier l'état d'authentification admin côté serveur
  const checkAuth = async (initialCheck = false) => {
    // Si aucune session admin locale n'existe, afficher directement l'écran de connexion sans bloquer
    if (!AdminService.isAdminAuthenticated()) {
      setIsAuthenticated(false);
      setAuthChecking(false);
      return;
    }

    // N'afficher le loader de plein écran que lors du tout premier chargement
    if (initialCheck) {
      setAuthChecking(true);
    }

    try {
      const result = await AdminService.verifyServerSession();
      setIsAuthenticated(result.authenticated);
      if (result.authenticated) {
        loadAdminData();
      }
    } catch {
      // Tolérance réseau : si la session locale est toujours active, ne pas déconnecter
      if (!AdminService.isAdminAuthenticated()) {
        setIsAuthenticated(false);
      }
    } finally {
      if (initialCheck) {
        setAuthChecking(false);
      }
    }
  };

  useEffect(() => {
    checkAuth(true);

    // Vérification douce en arrière-plan toutes les 2 minutes sans bloquer l'interface
    const timer = setInterval(() => {
      checkAuth(false);
    }, 120000);
    return () => clearInterval(timer);
  }, []);

  // Afficher un toast éphémère
  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Charger les transactions depuis Supabase Cloud
  const loadTransactions = async () => {
    setTxLoading(true);
    try {
      const res = await AdminService.fetchCloudTransactions();
      if (res.success) {
        setTransactions(res.transactions);
        setTxStats(res.stats);
      }
    } catch (e) {
      console.warn("Erreur chargement transactions LigdiCash:", e);
    } finally {
      setTxLoading(false);
    }
  };

  // Synchronisation Complète Cloud Supabase (Utilisateurs + Transactions + Abonnements)
  const handleSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      await loadTransactions();
      loadAdminData();
      await handleRunDiagnostics();
      showToast("Synchronisation Cloud Supabase terminée avec succès", "success");
    } catch (e: any) {
      showToast("Erreur lors de la synchronisation cloud", "error");
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Re-vérifier une transaction auprès de la passerelle
  const handleReverifyTx = async (referenceCode: string, token?: string) => {
    setReverifyingRef(referenceCode);
    try {
      const res = await AdminService.reverifyLigdiCashTransaction(referenceCode, token);
      if (res.success) {
        showToast(res.message, res.isPaid ? "success" : "info");
        await loadTransactions();
        loadAdminData();
      } else {
        showToast(res.message, "error");
      }
    } catch (e: any) {
      showToast(e.message || "Erreur de contact avec la passerelle", "error");
    } finally {
      setReverifyingRef(null);
    }
  };

  // Valider manuellement une transaction (ex: confirmation par SMS opérateur)
  const handleManualValidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRef.trim()) return;

    try {
      const res = await AdminService.manualValidateTransaction(
        manualRef.trim(),
        manualEmail.trim() || undefined,
        manualPlan
      );
      if (res.success) {
        showToast(res.message, "success");
        setManualModalOpen(false);
        setManualRef("");
        setManualEmail("");
        await loadTransactions();
        loadAdminData();
      } else {
        showToast(res.message, "error");
      }
    } catch (e: any) {
      showToast(e.message || "Erreur de validation", "error");
    }
  };

  // Exporter les transactions au format CSV
  const handleExportTransactions = () => {
    const csvContent = AdminService.exportTransactionsCsv(transactions);
    if (!csvContent) {
      showToast("Aucune transaction à exporter", "info");
      return;
    }
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `moncv_transactions_mobile_money_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Export CSV des transactions généré avec succès", "success");
  };

  // Copier dans le presse-papier
  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedRef(id);
      setTimeout(() => setCopiedRef(null), 2500);
      showToast("Référence copiée dans le presse-papier", "info");
    }
  };

  // Charger toutes les données du dashboard admin
  const loadAdminData = () => {
    try {
      const currentMetrics = AdminService.getMetrics();
      setMetrics(currentMetrics);

      const allUsers = StorageManager.getRegisteredUsers();
      setUsers(allUsers);

      const logs = AdminService.getAuditLogs();
      setAuditLogs(logs);

      setMaintenanceMode(AdminService.isMaintenanceMode());
      loadTransactions();
    } catch (e) {
      console.error("Erreur chargement données admin", e);
    }
  };

  // Lancer le scanner de diagnostics
  const handleRunDiagnostics = async () => {
    setDiagLoading(true);
    try {
      const results = await AdminService.runAllDiagnostics();
      setDiagnostics(results);
      loadAdminData();
      showToast("Scan de diagnostic terminé avec succès", "success");
    } catch (e) {
      showToast("Erreur lors du scan de diagnostic", "error");
    } finally {
      setDiagLoading(false);
    }
  };

  // Connexion Admin Haute Sécurité
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await AdminService.unlockWithMasterKey(passkeyInput, emailInput);
      if (res.success) {
        setIsAuthenticated(true);
        loadAdminData();
        handleRunDiagnostics();
        showToast("Console d'Administration déverrouillée", "success");
      } else {
        setAuthError(res.message);
        if (res.remainingAttempts !== undefined) {
          setRemainingAttempts(res.remainingAttempts);
        }
        if (res.blocked) {
          setIsLockedOut(true);
          setLockoutCountdown(res.resetInSeconds || 900);
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || "Erreur lors de la vérification des identifiants.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Déconnexion Admin & Verrouillage Immédiat
  const handleLogout = async () => {
    await AdminService.logoutAdmin();
    setIsAuthenticated(false);
    setPasskeyInput("");
    setAuthError("");
    showToast("Console d'Administration verrouillée", "info");
  };

  // Exécution de correctifs en 1 clic
  const handleRunFix = (actionId: string) => {
    if (actionId === "repair-subscriptions") {
      const res = AdminService.repairSubscriptions();
      if (res.success) {
        showToast(res.message, "success");
        loadAdminData();
        handleRunDiagnostics();
      } else {
        showToast(res.message, "error");
      }
    } else if (actionId === "fix-orphan-resumes") {
      const res = AdminService.fixOrphanResumes();
      if (res.success) {
        showToast(res.message, "success");
        loadAdminData();
        handleRunDiagnostics();
      } else {
        showToast(res.message, "error");
      }
    } else if (actionId === "purge-storage") {
      const res = AdminService.purgeTemporaryStorage();
      if (res.success) {
        showToast(res.message, "success");
        loadAdminData();
        handleRunDiagnostics();
      } else {
        showToast(res.message, "error");
      }
    } else if (actionId === "seed-demo") {
      const res = AdminService.seedDemoData();
      if (res.success) {
        showToast(res.message, "success");
        loadAdminData();
      } else {
        showToast(res.message, "error");
      }
    }
  };

  // Bascule du mode maintenance
  const handleToggleMaintenance = () => {
    const next = AdminService.toggleMaintenanceMode();
    setMaintenanceMode(next);
    showToast(
      next ? "Mode Maintenance ACTIVÉ sur le site" : "Mode Maintenance DÉSACTIVÉ",
      next ? "info" : "success"
    );
  };

  // Actions Utilisateurs
  const handleApplyPlanUpgrade = () => {
    if (!selectedUser) return;
    const res = AdminService.upgradeUserPlan(selectedUser.email, selectedPlanTier);
    if (res.success) {
      showToast(res.message, "success");
      setEditPlanModalOpen(false);
      loadAdminData();
    } else {
      showToast(res.message, "error");
    }
  };

  const handleApplyPasswordReset = () => {
    if (!selectedUser || !newPasswordInput.trim()) return;
    const res = AdminService.adminResetPassword(selectedUser.email, newPasswordInput.trim());
    if (res.success) {
      showToast(`Nouveau mot de passe enregistré pour ${selectedUser.email}`, "success");
      setResetPassModalOpen(false);
      setNewPasswordInput("");
      loadAdminData();
    } else {
      showToast(res.message, "error");
    }
  };

  const handleToggleSuspension = (user: RegisteredUser) => {
    const res = AdminService.toggleUserSuspension(user.email);
    if (res.success) {
      showToast(res.message, res.isSuspended ? "info" : "success");
      loadAdminData();
    } else {
      showToast(res.message, "error");
    }
  };

  const handleDeleteUser = (user: RegisteredUser) => {
    if (
      confirm(
        `Êtes-vous absolument sûr de vouloir supprimer définitivement le compte de ${user.firstName} ${user.lastName} (${user.email}) ? Cette action est irréversible.`
      )
    ) {
      const res = AdminService.adminDeleteUser(user.email);
      if (res.success) {
        showToast(res.message, "success");
        loadAdminData();
      } else {
        showToast(res.message, "error");
      }
    }
  };

  // Export CSV des utilisateurs
  const handleExportCsv = () => {
    const csvContent = AdminService.exportUsersCsv();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `moncv_export_utilisateurs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Export CSV généré avec succès", "success");
  };

  // Filtrage des utilisateurs
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (u.business?.companyName &&
          u.business.companyName.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
        (u.phone && u.phone.includes(searchQuery.trim()));

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && (u.role === "admin" || u.role === "superadmin" || u.email.includes("admin@"))) ||
        (roleFilter === "business" && (u.accountType === "business" || u.planTier?.startsWith("enterprise"))) ||
        (roleFilter === "candidate" && u.accountType !== "business" && !u.planTier?.startsWith("enterprise")) ||
        (roleFilter === "suspended" && u.isSuspended);

      const sub = StorageManager.getUserSubscription(u.email);
      const userPlan = sub?.planTier || u.planTier || "free";
      const matchesPlan =
        planFilter === "all" ||
        (planFilter === "paid" && userPlan !== "free") ||
        (planFilter === "free" && userPlan === "free") ||
        planFilter === userPlan;

      return matchesSearch && matchesRole && matchesPlan;
    });
  }, [users, searchQuery, roleFilter, planFilter]);

  // Utilisateurs Entreprises B2B
  const businessUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.accountType === "business" ||
        u.planTier?.startsWith("enterprise") ||
        u.planTier === "cyber15" ||
        Boolean(u.business?.companyName)
    );
  }, [users]);

  // Filtrage des transactions LigdiCash
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = txSearch.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        t.referenceCode.toLowerCase().includes(q) ||
        (t.externalToken && t.externalToken.toLowerCase().includes(q)) ||
        (t.userEmail && t.userEmail.toLowerCase().includes(q)) ||
        (t.phoneNumber && t.phoneNumber.toLowerCase().includes(q)) ||
        (t.provider && t.provider.toLowerCase().includes(q));

      const matchesStatus =
        txStatusFilter === "all" || t.status === txStatusFilter;

      const matchesPlan =
        txPlanFilter === "all" || t.planTier === txPlanFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [transactions, txSearch, txStatusFilter, txPlanFilter]);

  // =========================================================================
  // ÉCRAN DE VERROUILLAGE & ACCÈS SÉCURISÉ (SI NON AUTHENTIFIÉ)
  // =========================================================================
  if (authChecking) {
    return (
      <div
        className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-400"
        style={{ backgroundColor: "#020617", color: "#94a3b8", minHeight: "100vh" }}
      >
        <div className="flex items-center gap-3 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span>Initialisation de l'environnement sécurisé...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 text-slate-100">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide uppercase">
                <Lock className="w-3 h-3" />
                <span>Console Super Admin</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-2">
                MonCV.ai • Mission Control
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Supervision 360°, Diagnostic Système & Gestion Opérationnelle
              </p>
            </div>
          </div>

          {isLockedOut && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold space-y-1 animate-pulse">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="uppercase tracking-wider">Accès Verrouillé par Mesure de Sécurité</span>
              </div>
              <p className="font-normal text-slate-300">
                Trop de tentatives infructueuses détectées. Déblocage automatique dans :
              </p>
              <p className="text-base font-black text-rose-400 font-mono">
                {Math.floor(lockoutCountdown / 60)} min {String(lockoutCountdown % 60).padStart(2, "0")} sec
              </p>
            </div>
          )}

          {authError && !isLockedOut && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{authError}</span>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="text-[11px] text-amber-400 font-bold">
                    ⚠️ {remainingAttempts} tentative{remainingAttempts > 1 ? "s" : ""} restante{remainingAttempts > 1 ? "s" : ""} avant verrouillage.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Identifiant Administrateur / Email
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Optionnel si Clé Maître directe
                </span>
              </div>
              <input
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isLockedOut || authLoading}
                placeholder="admin@moncv.ai"
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Clé Maître (Master Passkey) ou Mot de passe
                </label>
                <span className="text-[10px] text-amber-400 font-bold">
                  Accès Requis
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  disabled={isLockedOut || authLoading}
                  placeholder="Saisissez la Clé Maître ou mot de passe..."
                  className="w-full pl-4 pr-11 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1"
                  tabIndex={-1}
                  title={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading || isLockedOut || !passkeyInput.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validation cryptographique SHA-256...</span>
                </>
              ) : isLockedOut ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Accès Verrouillé</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Déverrouiller le Command Center</span>
                </>
              )}
            </button>
          </form>

          {/* Audit de sécurité et conformité */}
          <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chiffrement SHA-256 & Anti-Brute-Force</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Comparaison temporelle constante • Verrouillage automatique après 3 tentatives infructueuses.
            </p>
            <p className="text-[10px] text-slate-500">
              Authentification haute sécurité réservée à la Direction Générale et aux Administrateurs habilités.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CONSOLE D'ADMINISTRATION COMPLÈTE (MISSION CONTROL)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Toast de notification flottant */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 transition-all transform animate-in slide-in-from-bottom-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/30"
              : toastMessage.type === "error"
              ? "bg-rose-950/90 text-rose-300 border-rose-500/30"
              : "bg-blue-950/90 text-blue-300 border-blue-500/30"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toastMessage.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Activity className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Barre Supérieure du Command Center */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-white">
                MonCV.ai <span className="text-blue-400">ADMIN</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Console Active</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                <Database className="w-2.5 h-2.5 text-blue-400" />
                <span>Supabase Connecté</span>
              </span>
              {maintenanceMode && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase">
                  Maintenance Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Console Super Admin • INNOVA GROUP
            </p>
          </div>
        </div>

        {/* Actions rapides header */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime}</span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <span>Site Public</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={handleSyncCloud}
            disabled={isSyncingCloud}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Synchroniser toutes les données avec Supabase Cloud PostgreSQL"
          >
            <Database className={`w-3.5 h-3.5 ${isSyncingCloud ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => {
              loadAdminData();
              handleRunDiagnostics();
            }}
            disabled={diagLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Actualiser les métriques et diagnostics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${diagLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Verrouiller la console et fermer la session"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Verrouiller</span>
          </button>
        </div>
      </header>

      {/* Navigation par Onglets */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 lg:px-8 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Vue d'ensemble & Métriques</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("claims")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "claims"
              ? "border-amber-500 text-amber-400 bg-amber-500/5 font-black"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Paiements Wave & Réclamations</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("transactions");
            if (transactions.length === 0) loadTransactions();
          }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "transactions"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Paiements Mobile Money ({transactions.length})</span>
          {txStats.pending > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black animate-pulse">
              {txStats.pending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "users"
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestion des Utilisateurs ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("business")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "business"
              ? "border-amber-500 text-amber-400 bg-amber-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Abonnements Entreprises B2B ({businessUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("diagnostics");
            if (diagnostics.length === 0) handleRunDiagnostics();
          }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "diagnostics"
              ? "border-purple-500 text-purple-400 bg-purple-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Diagnostic des Incidents</span>
          {diagnostics.some((d) => d.status === "warning" || d.status === "critical") && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("maintenance")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "maintenance"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Correctifs & Maintenance en 1 Clic</span>
        </button>
      </div>

      {/* Contenu Principal */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* ================================================================= */}
        {/* ONGLET RÉCLAMATIONS WAVE & CRÉDITS */}
        {/* ================================================================= */}
        {activeTab === "claims" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  Console dédiée aux validations de paiements Mobile Money
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gestion plein écran avec émission automatique de factures normalisées OHADA.
                </p>
              </div>
              <Link
                href="/admin/paiements"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition shrink-0"
              >
                Ouvrir /admin/paiements
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <AdminWaveClaimsTab onNotify={(text, type) => showToast(text, type)} />
          </div>
        )}

        {/* ================================================================= */}
        {/* ONGLET 1 : VUE D'ENSEMBLE & MÉTRIQUES CLÉS */}
        {/* ================================================================= */}
        {activeTab === "overview" && metrics && (
          <div className="space-y-6">
            {/* Cartes Métriques Clés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Utilisateurs */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Utilisateurs
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{metrics.totalUsers}</span>
                  <span className="text-xs text-slate-400 font-medium">inscrits</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{metrics.totalCandidates} Candidats</span>
                  <span>•</span>
                  <span>{metrics.totalBusinesses} Entreprises</span>
                </div>
              </div>

              {/* Total CVs Générés */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    CVs Générés & Stockés
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{metrics.totalResumes}</span>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
                    ATS ~{metrics.averageAtsScore}%
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Score de conformité optimal</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Chiffre d'Affaires Global FCFA */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Volume d'Affaires Total
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">
                    {metrics.totalRevenueFcfa.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">FCFA</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Taux de conversion</span>
                  <span className="text-emerald-400 font-bold">{metrics.conversionRate}%</span>
                </div>
              </div>

              {/* Abonnements Actifs */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Comptes Payants Actifs
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400">
                    {metrics.paidUsersCount}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">formules actives</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Accès à vie garanti</span>
                  <span className="text-blue-400 font-bold">100% opérationnel</span>
                </div>
              </div>
            </div>

            {/* Décomposition des Revenus par Formule & Graphique */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Répartition des formules */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Répartition des Formules & Recettes (FCFA)
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Suivi granulaire des conversions de chaque palier tarifaire
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Temps réel</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { tier: "1500", name: "Essentiel 1 500 FCFA (Candidat)", color: "bg-blue-500" },
                    { tier: "2500", name: "Pro 2 500 FCFA (Candidat)", color: "bg-indigo-500" },
                    { tier: "5000", name: "VIP 5 000 FCFA (Candidat)", color: "bg-amber-500" },
                    { tier: "cyber15", name: "Cyber 15 000 FCFA (15 CVs RH)", color: "bg-cyan-500" },
                    { tier: "enterprise30", name: "Starter PME 20 000 FCFA (30 CVs RH)", color: "bg-emerald-500" },
                    { tier: "enterprise75", name: "Business Pro 45 000 FCFA (75 CVs RH)", color: "bg-purple-500" },
                    { tier: "enterprise200", name: "Entreprise Premium 100 000 FCFA (200 CVs RH)", color: "bg-rose-500" },
                  ].map((item) => {
                    const data = metrics.revenueByPlan[item.tier as PlanTier] || { count: 0, revenueFcfa: 0 };
                    const maxRevenue = Math.max(metrics.totalRevenueFcfa, 1);
                    const percentage = Math.round((data.revenueFcfa / maxRevenue) * 100);

                    return (
                      <div key={item.tier} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">{data.count} souscription(s)</span>
                            <span className="font-black text-white">
                              {data.revenueFcfa.toLocaleString("fr-FR")} FCFA
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.max(percentage, data.count > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Journal d'Activité Récent (Audit Stream) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span>Journal d'Audit Récent</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {auditLogs.length} événements
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                    {auditLogs.slice(0, 8).map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                              log.severity === "success"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : log.severity === "warning"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : log.severity === "error"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] font-medium leading-snug">
                          {log.details || "Événement système enregistré"}
                        </p>
                        {log.targetUserEmail && (
                          <p className="text-[10px] text-slate-400 truncate">
                            Cible : {log.targetUserEmail}
                          </p>
                        )}
                      </div>
                    ))}

                    {auditLogs.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-6">
                        Aucun événement d'audit récent.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("maintenance")}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
                  >
                    Gérer et purger les logs dans Maintenance →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ONGLET : HISTORIQUE DES TRANSACTIONS & SOUSCRIPTIONS              */}
        {/* ================================================================= */}
        {activeTab === "transactions" && (
          <div className="space-y-6 fade-in">
            {/* Bannière Historique des Transactions */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white">
                      Historique des Accès & Souscriptions
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                      Accès Libre 100%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    L'ensemble des fonctionnalités de MonCV.ai est désormais disponible en accès libre gratuit. Ce tableau récapitule l'historique des activations et souscriptions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end lg:self-center">
                <button
                  type="button"
                  onClick={loadTransactions}
                  disabled={txLoading}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${txLoading ? "animate-spin" : ""}`} />
                  <span>Actualiser</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validation Manuelle</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportTransactions}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter CSV</span>
                </button>
              </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Chiffre d'Affaires Mobile Money
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">
                    {txStats.totalVolumeXof.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">FCFA</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Encaissé via Mobile Money
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Paiements Validés
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{txStats.completed}</span>
                  <span className="text-xs text-emerald-400 font-bold">confirmés</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Abonnements déverrouillés
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  En Attente de Validation
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400">{txStats.pending}</span>
                  <span className="text-xs text-slate-400 font-medium">initiés</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  En attente de confirmation client
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Transactions
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{txStats.total}</span>
                  <span className="text-xs text-slate-400 font-medium">flux enregistrés</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Échecs / Annulés : {txStats.failed}
                </p>
              </div>
            </div>

            {/* Barre de Recherche & Filtres */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Rechercher par référence, email client, téléphone, jeton..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">Tous les Statuts</option>
                  <option value="completed">Validés (Completed)</option>
                  <option value="pending">En Attente (Pending)</option>
                  <option value="failed">Échoués / Annulés</option>
                </select>

                <select
                  value={txPlanFilter}
                  onChange={(e) => setTxPlanFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">Toutes les Formules</option>
                  <option value="1500">Essentiel (1 500 F)</option>
                  <option value="2500">Pro (2 500 F)</option>
                  <option value="5000">VIP (5 000 F)</option>
                  <option value="cyber15">Cyber 15 (15 000 F)</option>
                  <option value="enterprise30">Starter RH (30 000 F)</option>
                  <option value="enterprise75">Business RH (75 000 F)</option>
                  <option value="enterprise200">Entreprise (200 000 F)</option>
                </select>
              </div>
            </div>

            {/* Tableau des Transactions */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Date & Heure</th>
                      <th className="py-3 px-4">Client / Contact</th>
                      <th className="py-3 px-4">Opérateur</th>
                      <th className="py-3 px-4">Formule</th>
                      <th className="py-3 px-4">Montant</th>
                      <th className="py-3 px-4">Référence & Jeton</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {txLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                            <span>Chargement des transactions depuis Supabase Cloud...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <p className="font-bold text-sm text-slate-300">Aucune transaction trouvée</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Les nouveaux paiements Mobile Money (Wave, Orange, MTN, Moov) s'afficheront ici en temps réel.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap text-[11px] font-mono text-slate-400">
                            {new Date(tx.createdAt).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white truncate max-w-[180px]">
                              {tx.userEmail || "Client Mobile Money"}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {tx.phoneNumber || "—"}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                              {tx.paymentMethod?.replace(/ligdicash\s*/i, "").replace(/[\(\)]/g, "").trim() || tx.provider?.toUpperCase() || "MOBILE MONEY"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">
                              {tx.planTier === "1500"
                                ? "Essentiel"
                                : tx.planTier === "2500"
                                ? "Pro"
                                : tx.planTier === "5000"
                                ? "VIP Illimité"
                                : tx.planTier === "cyber15"
                                ? "Cyber 15"
                                : tx.planTier === "enterprise30"
                                ? "Starter RH"
                                : tx.planTier === "enterprise75"
                                ? "Business RH"
                                : tx.planTier === "enterprise200"
                                ? "Entreprise Illimitée"
                                : tx.planTier}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-black text-white text-xs">
                              {(tx.amountXof || tx.amount || 0).toLocaleString("fr-FR")} FCFA
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-300 truncate max-w-[140px]" title={tx.referenceCode}>
                                {tx.referenceCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(tx.referenceCode, tx.id)}
                                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                title="Copier la référence"
                              >
                                {copiedRef === tx.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            {tx.externalToken && (
                              <span className="text-[10px] text-slate-500 truncate max-w-[140px] block" title={tx.externalToken}>
                                Token: {tx.externalToken.slice(0, 16)}...
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {tx.status === "completed" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Validé</span>
                              </span>
                            ) : tx.status === "pending" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>En Attente</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase">
                                <AlertCircle className="w-3 h-3 text-rose-400" />
                                <span>{tx.status}</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Re-vérifier auprès de la passerelle */}
                              <button
                                type="button"
                                onClick={() => handleReverifyTx(tx.referenceCode, tx.externalToken)}
                                disabled={reverifyingRef === tx.referenceCode}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700"
                                title="Interroger la passerelle de paiement en direct pour vérifier si le client a payé"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${reverifyingRef === tx.referenceCode ? "animate-spin text-emerald-400" : ""}`} />
                              </button>

                              {/* Si pending : bouton de validation manuelle rapide */}
                              {tx.status !== "completed" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setManualRef(tx.referenceCode);
                                    setManualEmail(tx.userEmail || "");
                                    setManualPlan(tx.planTier);
                                    setManualModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                  title="Valider manuellement cette transaction et activer le compte"
                                >
                                  Valider
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ONGLET 2 : GESTION DES UTILISATEURS */}
        {/* ================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Barre de recherche et actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, email, entreprise, téléphone..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">Tous les types ({users.length})</option>
                  <option value="candidate">Candidats</option>
                  <option value="business">Entreprises / RH</option>
                  <option value="admin">Administrateurs</option>
                  <option value="suspended">Comptes Suspendus</option>
                </select>

                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">Toutes les formules</option>
                  <option value="paid">Payants uniquement</option>
                  <option value="free">Gratuit</option>
                  <option value="1500">Essentiel 1 500</option>
                  <option value="2500">Pro 2 500</option>
                  <option value="5000">VIP 5 000</option>
                  <option value="cyber15">Cyber 15</option>
                  <option value="enterprise30">Starter 30</option>
                  <option value="enterprise75">Business 75</option>
                  <option value="enterprise200">Entreprise 200</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                  title="Exporter la liste en CSV"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden md:inline">Exporter CSV</span>
                </button>
              </div>
            </div>

            {/* Tableau des Utilisateurs */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                    <tr>
                      <th className="py-3.5 px-4">Utilisateur</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Formule Active</th>
                      <th className="py-3.5 px-4">Localisation</th>
                      <th className="py-3.5 px-4">Inscription</th>
                      <th className="py-3.5 px-4">Statut</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((user) => {
                      const sub = StorageManager.getUserSubscription(user.email);
                      const plan = sub?.planTier || user.planTier || "free";
                      const isEnterprise =
                        user.accountType === "business" ||
                        plan.startsWith("enterprise") ||
                        plan === "cyber15";

                      return (
                        <tr
                          key={user.id || user.email}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Utilisateur */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                                {user.business?.companyName && (
                                  <p className="text-[10px] text-amber-400 font-medium truncate">
                                    🏢 {user.business.companyName}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-4">
                            {user.role === "admin" || user.role === "superadmin" || user.email.includes("admin@") ? (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase">
                                SuperAdmin
                              </span>
                            ) : isEnterprise ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase">
                                Recruteur B2B
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase">
                                Candidat
                              </span>
                            )}
                          </td>

                          {/* Formule Active */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1 ${
                                plan === "enterprise200"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : plan === "enterprise75"
                                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                  : plan === "enterprise30"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : plan === "cyber15"
                                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                  : plan === "5000"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : plan === "2500"
                                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                  : plan === "1500"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              <Crown className="w-2.5 h-2.5" />
                              <span>
                                {plan === "enterprise200"
                                  ? "Entreprise 200"
                                  : plan === "enterprise75"
                                  ? "Business 75"
                                  : plan === "enterprise30"
                                  ? "Starter 30"
                                  : plan === "cyber15"
                                  ? "Cyber 15"
                                  : plan === "5000"
                                  ? "VIP (5 000 F)"
                                  : plan === "2500"
                                  ? "Pro (2 500 F)"
                                  : plan === "1500"
                                  ? "Essentiel (1 500 F)"
                                  : "Gratuit"}
                              </span>
                            </span>
                          </td>

                          {/* Localisation */}
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {user.city ? `${user.city}, ` : ""}
                            {user.country || "Côte d'Ivoire"}
                          </td>

                          {/* Inscription */}
                          <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                              : "Récent"}
                          </td>

                          {/* Statut */}
                          <td className="py-3.5 px-4">
                            {user.isSuspended ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                                <UserX className="w-3 h-3" />
                                <span>Suspendu</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                                <UserCheck className="w-3 h-3" />
                                <span>Actif</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Surclasser la formule */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedPlanTier(plan);
                                  setEditPlanModalOpen(true);
                                }}
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors cursor-pointer"
                                title="Modifier / Surclasser la formule"
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset mot de passe */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewPasswordInput("");
                                  setResetPassModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                                title="Réinitialiser le mot de passe"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* Suspendre / Activer */}
                              <button
                                type="button"
                                onClick={() => handleToggleSuspension(user)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  user.isSuspended
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
                                }`}
                                title={user.isSuspended ? "Réactiver le compte" : "Suspendre le compte"}
                              >
                                {user.isSuspended ? (
                                  <UserCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <UserX className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Supprimer */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                          Aucun utilisateur ne correspond à votre recherche ou filtre.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ONGLET 3 : ABONNEMENTS & VIVIERS ENTREPRISES B2B */}
        {/* ================================================================= */}
        {activeTab === "business" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-amber-400" />
                    <span>Supervision des Licences & Viviers RH Entreprises</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Gestion des comptes recruteurs, suivi des quotas candidats et consommation B2B
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                    {businessUsers.length} Entreprise(s) enregistrée(s)
                  </span>
                </div>
              </div>

              {/* Grille des comptes Entreprises */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {businessUsers.map((b) => {
                  const sub = StorageManager.getUserSubscription(b.email);
                  const plan = sub?.planTier || b.planTier || "enterprise30";
                  const allowed = sub?.allowedCandidates || 30;

                  return (
                    <div
                      key={b.id || b.email}
                      className="p-5 bg-slate-800/50 border border-slate-700/70 rounded-2xl space-y-4 hover:border-amber-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">
                              {b.business?.companyName || `${b.firstName} ${b.lastName}`}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase">
                              {plan}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{b.email}</p>
                          {b.phone && <p className="text-[11px] text-slate-400">Tél : {b.phone}</p>}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(b);
                            setSelectedPlanTier(plan);
                            setEditPlanModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Ajuster Formule
                        </button>
                      </div>

                      {/* Quota Vivier */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Capacité Vivier RH</span>
                          <span className="font-bold text-white">
                            Jusqu'à {allowed} candidats
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-2/5" />
                        </div>
                      </div>

                      {/* Données de Facturation */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                        <div>
                          <span className="block text-slate-500">Forme juridique :</span>
                          <span className="text-slate-300 font-medium">
                            {b.business?.companyType || "SARL / SA"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-500">RCCM :</span>
                          <span className="text-slate-300 font-medium">
                            {b.business?.rccm || "Enregistré"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {businessUsers.length === 0 && (
                  <div className="col-span-2 py-12 text-center text-slate-500 italic space-y-3">
                    <p>Aucun compte entreprise n'a encore été créé sur la plateforme.</p>
                    <button
                      type="button"
                      onClick={() => handleRunFix("seed-demo")}
                      className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer hover:bg-amber-400 transition-all"
                    >
                      Générer une entreprise démo (Groupe Bâtir Afrique BTP)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ONGLET 4 : DIAGNOSTIC DES INCIDENTS & SANTÉ */}
        {/* ================================================================= */}
        {activeTab === "diagnostics" && (
          <div className="space-y-6">
            {/* Header Diagnostic */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-purple-400" />
                  <span>Moteur de Diagnostic Proactif des Incidents</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Scanner d'intégrité en 6 points de contrôle avec détection d'anomalies et correctifs automatisés
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunDiagnostics}
                disabled={diagLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${diagLoading ? "animate-spin" : ""}`} />
                <span>Exécuter le scan d'intégrité complet</span>
              </button>
            </div>

            {/* Grille des 6 points de contrôle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnostics.map((diag) => (
                <div
                  key={diag.id}
                  className={`p-5 bg-slate-900 border rounded-2xl space-y-3 transition-all ${
                    diag.status === "healthy"
                      ? "border-emerald-500/30 shadow-sm shadow-emerald-500/5"
                      : diag.status === "warning"
                      ? "border-amber-500/40 shadow-sm shadow-amber-500/5"
                      : "border-rose-500/50 shadow-sm shadow-rose-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {diag.status === "healthy" ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : diag.status === "warning" ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                      <h4 className="font-bold text-white text-xs">{diag.title}</h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        diag.status === "healthy"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : diag.status === "warning"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {diag.status === "healthy" ? "Sain" : diag.status === "warning" ? "Attention" : "Critique"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {diag.message}
                  </p>

                  {diag.autoFixAvailable && diag.fixActionId && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRunFix(diag.fixActionId!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Appliquer le correctif auto</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cartes d'infrastructure */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                  <Server className="w-4 h-4 text-blue-400" />
                  <span>Serveur Applicatif Next.js</span>
                </div>
                <p className="text-lg font-black text-white">Opérationnel (Node.js 22)</p>
                <p className="text-[11px] text-emerald-400 font-medium">Réponse HTTP 200 OK</p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>PostgreSQL Cloud Supabase</span>
                </div>
                <p className="text-lg font-black text-white">Connecté / Tolérance Hors-Ligne</p>
                <p className="text-[11px] text-slate-400 font-medium">Synchronisation bi-directionnelle</p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <span>Stockage Local Chiffré</span>
                </div>
                <p className="text-lg font-black text-white">Intégrité 100% Vérifiée</p>
                <p className="text-[11px] text-slate-400 font-medium">Clés dédiées inviolables</p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ONGLET 5 : CORRECTIFS & MAINTENANCE EN 1 CLIC */}
        {/* ================================================================= */}
        {activeTab === "maintenance" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-emerald-400" />
                  <span>Console d'Exécution des Correctifs & Maintenance</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Déclenchez des routines de réparation déterministes pour garantir la résilience et la continuité de service
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Correctif 1 */}
                <div className="p-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <h4 className="font-bold text-white text-xs">
                        Réparer & Consolider les Abonnements
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Parcourt tous les comptes inscrits et s'assure que chaque formule payante est inscrite de façon permanente dans la clé inviolable <code className="text-[10px] text-amber-300">moncv_sub_&#123;email&#125;</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunFix("repair-subscriptions")}
                    className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Exécuter la Consolidation des Abonnements</span>
                  </button>
                </div>

                {/* Correctif 2 */}
                <div className="p-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <h4 className="font-bold text-white text-xs">
                        Rattacher & Indexer les CVs Orphelins
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Détecte les CVs stockés en local dont l'email de propriétaire est manquant et les réassocie proprement à la session active ou au profil principal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunFix("fix-orphan-resumes")}
                    className="w-full py-2.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Rattacher les CVs Orphelins</span>
                  </button>
                </div>

                {/* Correctif 3 */}
                <div className="p-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      <h4 className="font-bold text-white text-xs">
                        Nettoyer & Compacter le Stockage
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Purger les clés temporaires de calcul, les sessions orphelines et les caches de prévisualisation pour libérer de l'espace mémoire.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunFix("purge-storage")}
                    className="w-full py-2.5 px-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Nettoyer le Stockage Local</span>
                  </button>
                </div>

                {/* Correctif 4 */}
                <div className="p-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-white text-xs">
                        Générateur de Profils de Démonstration
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Crée en un clic un compte Candidat VIP complet (5 000 FCFA) et un compte Entreprise (75 000 FCFA avec vivier BTP) pour les présentations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunFix("seed-demo")}
                    className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Générer les Profils Démo</span>
                  </button>
                </div>
              </div>

              {/* Maintenance Mode Toggle */}
              <div className="p-5 bg-slate-800/80 border border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        maintenanceMode ? "text-amber-400" : "text-slate-400"
                      }`}
                    />
                    <h4 className="font-bold text-white text-xs">
                      Bascule du Mode Maintenance Global
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Affiche un bandeau d'alerte sur l'ensemble du site informant les candidats et recruteurs d'une mise à jour programmée.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMaintenance}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    maintenanceMode
                      ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                  }`}
                >
                  {maintenanceMode ? "Désactiver la Maintenance" : "Activer la Maintenance"}
                </button>
              </div>

              {/* Purge du journal d'audit */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Supprimer tous les événements du journal d'audit administratif ?")) {
                      AdminService.clearAuditLogs();
                      loadAdminData();
                      showToast("Journal d'audit réinitialisé", "info");
                    }
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer"
                >
                  Purger l'historique du journal d'audit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* MODAL 1 : SURCLASSEMENT / MODIFICATION DE FORMULE */}
      {/* ================================================================= */}
      {editPlanModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Modifier la Formule Utilisateur</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditPlanModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-white">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p className="text-slate-400 font-mono text-[11px]">{selectedUser.email}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Sélectionner la nouvelle formule :
              </label>
              <select
                value={selectedPlanTier}
                onChange={(e) => setSelectedPlanTier(e.target.value as PlanTier)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <optgroup label="Formules Candidats">
                  <option value="free">Gratuit (Limité)</option>
                  <option value="1500">Essentiel (1 500 FCFA)</option>
                  <option value="2500">Pro (2 500 FCFA)</option>
                  <option value="5000">VIP Illimité (5 000 FCFA)</option>
                </optgroup>
                <optgroup label="Formules Entreprises / Recruteurs">
                  <option value="cyber15">Cyber 15 (15 000 FCFA - 15 CVs)</option>
                  <option value="enterprise30">Starter PME (20 000 FCFA - 30 CVs)</option>
                  <option value="enterprise75">Business Pro (45 000 FCFA - 75 CVs)</option>
                  <option value="enterprise200">Entreprise Premium (100 000 FCFA - 200 CVs)</option>
                </optgroup>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditPlanModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleApplyPlanUpgrade}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Enregistrer & Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2 : RÉINITIALISATION DU MOT DE PASSE */}
      {/* ================================================================= */}
      {resetPassModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                <span>Réinitialiser le Mot de Passe</span>
              </h3>
              <button
                type="button"
                onClick={() => setResetPassModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-white">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p className="text-slate-400 font-mono text-[11px]">{selectedUser.email}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Nouveau mot de passe temporaire ou définitif :
              </label>
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Ex: MonCV2026!"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetPassModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleApplyPasswordReset}
                disabled={!newPasswordInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                Enregistrer le mot de passe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3 : VALIDATION MANUELLE DE TRANSACTION MOBILE MONEY         */}
      {/* ================================================================= */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Validation Manuelle d'un Paiement</span>
              </h3>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Permet au SuperAdmin de forcer l'activation immédiate d'un abonnement si un paiement Mobile Money a été confirmé hors-ligne ou par SMS opérateur.
            </p>

            <form onSubmit={handleManualValidateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Référence Unique de Transaction <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="Ex: TRX_LC_1789356609518_7e85v"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Email du Client / Compte à Débloquer <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="client@domaine.com"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Formule à Débloquer
                </label>
                <select
                  value={manualPlan}
                  onChange={(e) => setManualPlan(e.target.value as PlanTier)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <optgroup label="Formules Candidats">
                    <option value="1500">Essentiel (1 500 FCFA)</option>
                    <option value="2500">Pro (2 500 FCFA)</option>
                    <option value="5000">VIP Illimité (5 000 FCFA)</option>
                  </optgroup>
                  <optgroup label="Formules Entreprises / Recruteurs">
                    <option value="cyber15">Cyber 15 (15 000 FCFA)</option>
                    <option value="enterprise30">Starter RH (30 000 FCFA)</option>
                    <option value="enterprise75">Business RH (75 000 FCFA)</option>
                    <option value="enterprise200">Entreprise Illimitée (200 000 FCFA)</option>
                  </optgroup>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer & Activer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
