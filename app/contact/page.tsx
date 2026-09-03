"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Send,
  Building,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Clock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Support Technique / Assistance");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
        setSubmitted(false);
      }, 5000);
    }, 1000);
  };

  const whatsappSupportUrl =
    "https://wa.me/2250700000000?text=Bonjour%20l'%C3%A9quipe%20INNOVA%20GROUP%20%2F%20MonCV.ai,%20j'aimerais%20avoir%20une%20assistance%20concernant%20mon%20CV.";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              M
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              MonCV<span className="text-blue-600">.ai</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Support INNOVA GROUP en Ligne
            </span>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {/* En-tête de page */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>Support & Relations Publiques • INNOVA GROUP</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Nous Contacter
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Une question sur vos modèles de CV, votre pack VIP, un partenariat B2B ou un besoin d'assistance ? L'équipe <strong>INNOVA GROUP</strong> est à votre entière disposition.
          </p>
        </div>

        {/* Grille Contact : Coordonnées + Formulaire */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Colonne Gauche : Canaux de contact directs */}
          <div className="lg:col-span-5 space-y-4">
            {/* Carte Développeur Officiel INNOVA GROUP */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-black text-sm shadow-md">
                  IG
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block">
                    Éditeur & Développeur
                  </span>
                  <h2 className="font-extrabold text-base tracking-tight">INNOVA GROUP</h2>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                MonCV.ai est conçu, développé et propulsé par <strong>INNOVA GROUP</strong>, acteur majeur des solutions logicielles d'ingénierie et de productivité digitale.
              </p>

              <div className="pt-2 border-t border-slate-700/80 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Disponibilité du support : <strong>7j/7, de 8h à 21h GMT</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Temps de réponse moyen : <strong>Moins de 15 minutes</strong></span>
                </div>
              </div>
            </div>

            {/* Canal WhatsApp Direct */}
            <a
              href={whatsappSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-lg shadow-emerald-500/20 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
                    Assistance Instantanée
                  </span>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
                <h2 className="font-black text-base">Chat WhatsApp Direct</h2>
                <p className="text-xs text-emerald-100">Échangez directement avec un conseiller INNOVA GROUP</p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-200" />
            </a>

            {/* Canaux Traditionnels */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <a
                href="mailto:support@moncv.ai"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10.5px] font-bold text-slate-400 block">Email Support Candidats</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800">support@moncv.ai</span>
                </div>
              </a>

              <a
                href="mailto:contact@innovagroup.io"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border-t border-slate-100 pt-3"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10.5px] font-bold text-slate-400 block">Partenariats & Siège INNOVA GROUP</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800">contact@innovagroup.io</span>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-xl border-t border-slate-100 pt-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10.5px] font-bold text-slate-400 block">Zones de Couverture Opérationnelle</span>
                  <span className="text-xs font-semibold text-slate-700">
                    Côte d'Ivoire • Sénégal • Cameroun • Burkina Faso • Mali • International
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Droite : Formulaire de contact interactif */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
            {submitted ? (
              <div className="py-12 text-center space-y-3 fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Message envoyé avec succès !</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Merci de nous avoir contactés. L'équipe support d'<strong>INNOVA GROUP</strong> a bien reçu votre demande et vous répondra sous quelques instants.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Envoyer un message à l'équipe INNOVA GROUP
                  </h3>
                  <p className="text-xs text-slate-500">
                    Remplissez le formulaire ci-dessous pour une prise en charge rapide.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Votre Nom Complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Jean Kouassi"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Votre Adresse Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Numéro Téléphone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Motif de la Demande
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 cursor-pointer"
                    >
                      <option>Support Technique / Assistance CV</option>
                      <option>Question sur le Pack VIP & Portfolio</option>
                      <option>Paiement Mobile Money / Facturation</option>
                      <option>Partenariat Entreprise / Recrutement</option>
                      <option>Autre question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Votre Message détaillé <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Expliquez-nous précisément comment nous pouvons vous aider..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Transmission en cours..." : "Envoyer mon message à INNOVA GROUP"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MonCV.ai</span>
            <span>•</span>
            <span>Développé par <strong>INNOVA GROUP</strong></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-blue-600 transition-colors">
              Conditions d'Utilisation
            </Link>
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Créer un CV
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
