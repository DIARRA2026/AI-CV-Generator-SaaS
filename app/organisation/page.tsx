"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { WavePaymentClaimModal } from "@/components/tools/WavePaymentClaimModal";
import {
  Building2, Users, CreditCard, ShieldCheck, Plus, ArrowUpRight,
  Download, Clock, CheckCircle2, AlertCircle, Trash2, Mail, Palette,
  Settings, ChevronRight, BarChart3, FileSpreadsheet, Lock, X
} from "lucide-react";
import { Organization, OrganizationMember } from "@/lib/types";

export default function OrganisationPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [consumption, setConsumption] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "consumption" | "branding">("members");

  const [isWaveModalOpen, setIsWaveModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgPack, setNewOrgPack] = useState("structure");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"membre" | "admin">("membre");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [brandingName, setBrandingName] = useState("");
  const [brandingRccm, setBrandingRccm] = useState("");
  const [brandingIfu, setBrandingIfu] = useState("");
  const [brandingPhone, setBrandingPhone] = useState("");
  const [brandingColor, setBrandingColor] = useState("#2563EB");
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingMsg, setBrandingMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organisations");
      if (res.ok) {
        const data = await res.json();
        const list = data.organizations || [];
        setOrgs(list);
        if (list.length > 0 && !selectedOrg) {
          setSelectedOrg(list[0]);
        }
      }
    } catch (err) {
      console.error("Erreur chargement organisations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgDetails = async (orgId: string) => {
    try {
      const memRes = await fetch(`/api/organisations/members?orgId=${orgId}`);
      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData.members || []);
      }
      const credRes = await fetch(`/api/credits?orgId=${orgId}`);
      if (credRes.ok) {
        const credData = await credRes.json();
        setConsumption(credData.ledger || []);
      }
    } catch (err) {
      console.error("Erreur détails organisation:", err);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchOrgDetails(selectedOrg.id);
      setBrandingName(selectedOrg.nom || "");
      setBrandingRccm(selectedOrg.rccm || "");
      setBrandingIfu(selectedOrg.ifu || "");
      setBrandingPhone(selectedOrg.telephone || "");
      setBrandingColor(selectedOrg.couleurPrimaire || "#2563EB");
    }
  }, [selectedOrg]);

  useEffect(() => {
    if (!isCreateModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCreateModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateModalOpen]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      const res = await fetch("/api/organisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newOrgName, packSlug: newOrgPack }),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewOrgName("");
        await fetchOrganizations();
      }
    } catch (err) {
      console.error("Erreur création organisation:", err);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch("/api/organisations/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: selectedOrg.id, email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMsg({ type: "success", text: data.message || "Membre ajouté avec succès !" });
        setInviteEmail("");
        fetchOrgDetails(selectedOrg.id);
        fetchOrganizations();
      } else {
        setInviteMsg({ type: "error", text: data.message || "Impossible d ajouter ce membre." });
      }
    } catch (err: any) {
      setInviteMsg({ type: "error", text: err.message || "Erreur réseau." });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!selectedOrg) return;
    if (!confirm("Voulez-vous retirer ce membre de l organisation ?")) return;
    try {
      const res = await fetch(`/api/organisations/members?orgId=${selectedOrg.id}&userId=${targetUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchOrgDetails(selectedOrg.id);
        fetchOrganizations();
      }
    } catch (err) {
      console.error("Erreur suppression membre:", err);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setSavingBranding(true);
    setBrandingMsg(null);
    try {
      const res = await fetch("/api/organisations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: selectedOrg.id, nom: brandingName, rccm: brandingRccm,
          ifu: brandingIfu, telephone: brandingPhone, couleurPrimaire: brandingColor,
        }),
      });
      if (res.ok) {
        setBrandingMsg({ type: "success", text: "Informations mises à jour !" });
        fetchOrganizations();
      } else {
        setBrandingMsg({ type: "error", text: "Erreur lors de la mise à jour." });
      }
    } catch (err: any) {
      setBrandingMsg({ type: "error", text: err.message });
    } finally {
      setSavingBranding(false);
    }
  };

  const exportCSV = () => {
    if (!consumption || consumption.length === 0) return;
    const headers = ["Date", "Action", "Montant_Credits", "Reference"];
    const rows = consumption.map((c) => [
      new Date(c.creeLe || c.createdAt).toLocaleString("fr-FR"),
      c.action, c.montant || c.delta, c.reference || c.ref,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `consommation_${selectedOrg?.slug || "org"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isOwnerOrAdmin = selectedOrg?.monRole === "proprietaire" || selectedOrg?.monRole === "admin";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Espace Entreprise & Organisations
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Gérez vos sièges utilisateurs, votre solde de crédits mutualisé et vos factures OHADA.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {orgs.length > 0 && (
              <select
                value={selectedOrg?.id || ""}
                onChange={(e) => {
                  const found = orgs.find((o) => o.id === e.target.value);
                  if (found) setSelectedOrg(found);
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nom} ({o.packNom || o.packSlug})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Nouvelle organisation
            </button>
          </div>
        </div>

        {loading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Chargement de votre espace entreprise...</p>
          </div>
        )}

        {!loading && orgs.length === 0 && (
          <div className="p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Vous n avez pas encore d organisation
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Créez votre structure pour mutualiser vos crédits entre plusieurs collaborateurs,
              bénéficier du tarif entreprise avantageux et obtenir des factures normalisées OHADA.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-4 h-4" />
              Créer mon espace entreprise
            </button>
          </div>
        )}

        {!loading && selectedOrg && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Solde de l organisation</span>
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {selectedOrg.soldeCredits?.toLocaleString("fr-FR") || 0}
                  </span>
                  <span className="text-xs font-bold text-blue-600">crédits</span>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <span className="text-slate-500">
                    {selectedOrg.prochaineExpiration
                      ? `Expire le ${new Date(selectedOrg.prochaineExpiration).toLocaleDateString("fr-FR")}`
                      : "Lots permanents actifs"}
                  </span>
                  <button
                    onClick={() => setIsWaveModalOpen(true)}
                    className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Recharger
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Sièges & Utilisateurs</span>
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {selectedOrg.siegesUtilises}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    / {selectedOrg.siegesMax ? `${selectedOrg.siegesMax} sièges autorisés` : "Illimité"}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{
                        width: selectedOrg.siegesMax
                          ? `${Math.min(100, Math.round(((selectedOrg.siegesUtilises || 1) / selectedOrg.siegesMax) * 100))}%`
                          : "10%",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Pack Entreprise</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white capitalize">
                    {selectedOrg.packNom || selectedOrg.packSlug}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-bold text-[10px]">
                    Actif
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  Facture normalisée OHADA disponible sur toutes les recharges.
                </p>
              </div>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
              <button
                onClick={() => setActiveTab("members")}
                className={`pb-3 text-xs sm:text-sm font-bold inline-flex items-center gap-2 border-b-2 transition ${
                  activeTab === "members"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Users className="w-4 h-4" />
                Collaborateurs ({members.length})
              </button>

              <button
                onClick={() => setActiveTab("consumption")}
                className={`pb-3 text-xs sm:text-sm font-bold inline-flex items-center gap-2 border-b-2 transition ${
                  activeTab === "consumption"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Consommation & Audit
              </button>

              <button
                onClick={() => setActiveTab("branding")}
                className={`pb-3 text-xs sm:text-sm font-bold inline-flex items-center gap-2 border-b-2 transition ${
                  activeTab === "branding"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Palette className="w-4 h-4" />
                Identité & Facturation
              </button>
            </div>

            {activeTab === "members" && (
              <div className="space-y-6">
                {isOwnerOrAdmin && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-blue-600" />
                      Ajouter un collaborateur
                    </h3>

                    {inviteMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          inviteMsg.type === "success"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {inviteMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {inviteMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        required
                        placeholder="email@collaborateur.ci"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                      />

                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                      >
                        <option value="membre">Rôle : Membre</option>
                        <option value="admin">Rôle : Administrateur</option>
                      </select>

                      <button
                        type="submit"
                        disabled={inviting}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition disabled:opacity-50"
                      >
                        {inviting ? "Ajout..." : "Ajouter le collaborateur"}
                      </button>
                    </form>
                  </div>
                )}

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Collaborateur</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Rôle</th>
                        <th className="py-3.5 px-4">Membre depuis</th>
                        {isOwnerOrAdmin && <th className="py-3.5 px-4 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {members.map((m) => (
                        <tr key={m.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {m.fullName || "Utilisateur"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                            {m.email}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                m.role === "proprietaire"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : m.role === "admin"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {m.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(m.creeLe).toLocaleDateString("fr-FR")}
                          </td>
                          {isOwnerOrAdmin && (
                            <td className="py-3.5 px-4 text-right">
                              {m.role !== "proprietaire" && (
                                <button
                                  onClick={() => handleRemoveMember(m.userId)}
                                  className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                  title="Retirer ce membre"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "consumption" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Journal complet de chaque génération et action IA débitée sur le compte de l organisation.
                  </p>
                  <button
                    onClick={exportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exporter en CSV
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  {consumption.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      Aucune consommation enregistrée pour le moment.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3.5 px-4">Date & Heure</th>
                          <th className="py-3.5 px-4">Action</th>
                          <th className="py-3.5 px-4">Montant</th>
                          <th className="py-3.5 px-4">Référence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {consumption.map((entry, idx) => (
                          <tr key={entry.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3.5 px-4 text-slate-500">
                              {new Date(entry.creeLe || entry.createdAt).toLocaleString("fr-FR")}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                              {entry.action}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-rose-600">
                              {entry.montant || entry.delta} cr.
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                              {entry.reference || entry.ref}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === "branding" && (
              <div className="max-w-2xl bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Identité de marque & Coordonnées OHADA
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ces informations apparaissent sur vos CV exportés et vos factures normalisées.
                  </p>
                </div>

                {brandingMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      brandingMsg.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {brandingMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {brandingMsg.text}
                  </div>
                )}

                <form onSubmit={handleSaveBranding} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nom officiel de la structure
                    </label>
                    <input
                      type="text"
                      required
                      value={brandingName}
                      onChange={(e) => setBrandingName(e.target.value)}
                      disabled={!isOwnerOrAdmin}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Numéro RCCM
                      </label>
                      <input
                        type="text"
                        placeholder="CI-ABJ-03-202X-BXX-XXXXX"
                        value={brandingRccm}
                        onChange={(e) => setBrandingRccm(e.target.value)}
                        disabled={!isOwnerOrAdmin}
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Numéro IFU / CC
                      </label>
                      <input
                        type="text"
                        placeholder="XXXXXXXXX"
                        value={brandingIfu}
                        onChange={(e) => setBrandingIfu(e.target.value)}
                        disabled={!isOwnerOrAdmin}
                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Téléphone de contact
                    </label>
                    <input
                      type="text"
                      placeholder="+225 07 XX XX XX XX"
                      value={brandingPhone}
                      onChange={(e) => setBrandingPhone(e.target.value)}
                      disabled={!isOwnerOrAdmin}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Couleur primaire de marque sur les CV
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandingColor}
                        onChange={(e) => setBrandingColor(e.target.value)}
                        disabled={!isOwnerOrAdmin}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-300 uppercase">
                        {brandingColor}
                      </span>
                    </div>
                  </div>

                  {isOwnerOrAdmin && (
                    <button
                      type="submit"
                      disabled={savingBranding}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      {savingBranding ? "Enregistrement..." : "Enregistrer les modifications"}
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Création Organisation */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-auto relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Créer une nouvelle organisation
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configurez votre espace entreprise pour démarrer avec votre équipe.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nom de l organisation
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Cabinet Diarra RH"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pack d entrée envisagé
                </label>
                <select
                  value={newOrgPack}
                  onChange={(e) => setNewOrgPack(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="revendeur">Revendeur (10 000 F — 1 siège — 1 500 cr.)</option>
                  <option value="structure">Structure (25 000 F — 3 sièges — 5 000 cr.)</option>
                  <option value="business_pro">Business Pro (60 000 F — 10 sièges — 15 000 cr.)</option>
                  <option value="licence_etablissement">Licence Établissement (150 000 F — Sièges illimités)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Créer l organisation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrg && (
        <WavePaymentClaimModal
          isOpen={isWaveModalOpen}
          onClose={() => setIsWaveModalOpen(false)}
          defaultPackCode={(selectedOrg.packSlug as any) || "structure"}
          orgId={selectedOrg.id}
          onSuccess={() => {
            setIsWaveModalOpen(false);
            fetchOrganizations();
            fetchOrgDetails(selectedOrg.id);
          }}
        />
      )}
    </div>
  );
}
