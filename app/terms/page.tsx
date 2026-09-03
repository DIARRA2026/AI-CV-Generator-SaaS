"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Building,
  CheckCircle2,
  Lock,
  Smartphone,
  Globe,
  HelpCircle,
  ArrowLeft,
  Mail,
  Printer,
} from "lucide-react";

export default function TermsPage() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header Sticky */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              M
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              MonCV<span className="text-blue-600">.ai</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour au site</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Titre Principal & Éditeur */}
        <div className="border-b border-slate-200 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Document Légal Officiel • Dernière mise à jour : Septembre 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Conditions Générales d'Utilisation (CGU)
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de la plateforme logicielle en ligne <strong>MonCV.ai</strong>, ainsi que l'ensemble des services associés.
          </p>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex items-start gap-3 mt-4">
            <Building className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950">
              <strong className="block font-bold text-sm text-blue-900 mb-0.5">
                Application éditée et développée par INNOVA GROUP
              </strong>
              MonCV.ai est un produit logiciel conçu, développé, maintenu et commercialisé à l'échelle internationale par <strong>INNOVA GROUP</strong>. Tous les droits de propriété intellectuelle sur la plateforme, les algorithmes de rédaction IA et l'architecture logicielle appartiennent exclusivement à INNOVA GROUP.
            </div>
          </div>
        </div>

        {/* Sommaire Rapide */}
        <nav className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 no-print">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
            Sommaire des Articles
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
            <a href="#art1" className="hover:text-blue-600 flex items-center gap-1.5">1. Mentions Légales & Éditeur</a>
            <a href="#art2" className="hover:text-blue-600 flex items-center gap-1.5">2. Objet & Champ d'Application</a>
            <a href="#art3" className="hover:text-blue-600 flex items-center gap-1.5">3. Description des Services SaaS</a>
            <a href="#art4" className="hover:text-blue-600 flex items-center gap-1.5">4. Compte & Sécurité des Données</a>
            <a href="#art5" className="hover:text-blue-600 flex items-center gap-1.5">5. Formules Tarifaires & Mobile Money</a>
            <a href="#art6" className="hover:text-blue-600 flex items-center gap-1.5">6. Intelligence Artificielle & Contenus</a>
            <a href="#art7" className="hover:text-blue-600 flex items-center gap-1.5">7. Propriété Intellectuelle</a>
            <a href="#art8" className="hover:text-blue-600 flex items-center gap-1.5">8. Protection des Données (RGPD)</a>
            <a href="#art9" className="hover:text-blue-600 flex items-center gap-1.5">9. Disponibilité du Service & SLA</a>
            <a href="#art10" className="hover:text-blue-600 flex items-center gap-1.5">10. Contact & Réclamations</a>
          </div>
        </nav>

        {/* Corps des Conditions */}
        <div className="space-y-10 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Article 1 */}
          <section id="art1" className="space-y-3 pt-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">Article 1.</span>
              <span>Mentions Légales & Identification de l'Éditeur</span>
            </h2>
            <p>
              Le site web et l'application SaaS accessibles à l'adresse <strong>moncv.ai</strong> sont édités et développés par la société <strong>INNOVA GROUP</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Éditeur et Développeur :</strong> INNOVA GROUP</li>
              <li><strong>Activité :</strong> Ingénierie logicielle, intelligence artificielle et solutions numériques pour l'emploi</li>
              <li><strong>Contact Support :</strong> contact@innovagroup.io / support@moncv.ai</li>
              <li><strong>Assistance Directe :</strong> WhatsApp Service Client INNOVA GROUP 7j/7</li>
            </ul>
          </section>

          {/* Article 2 */}
          <section id="art2" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">Article 2.</span>
              <span>Objet & Acceptation des Conditions Générales</span>
            </h2>
            <p>
              Les présentes CGU ont pour objet de définir les modalités et conditions dans lesquelles <strong>INNOVA GROUP</strong> met à la disposition des utilisateurs sa plateforme en ligne d'aide à la création de CV professionnels, de demandes d'emploi officielles, de lettres de motivation assistées par IA et de sites web portfolios interactifs.
            </p>
            <p>
              Toute création de compte ou utilisation du service emporte l'adhésion pleine et entière de l'utilisateur aux présentes CGU. Si l'utilisateur refuse d'adhérer aux présentes conditions, il doit cesser immédiatement toute utilisation du service.
            </p>
          </section>

          {/* Article 3 */}
          <section id="art3" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">Article 3.</span>
              <span>Description des Services SaaS Fournis</span>
            </h2>
            <p>
              MonCV.ai propose à ses utilisateurs un ensemble d'outils digitaux innovants :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">Générateur de CV Normé ATS</strong>
                Mise en page automatique en format A4 vectoriel optimisé pour le passage sans rejet des filtres de recrutement.
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">Demandes d'Emploi Officielles</strong>
                Modèles formels conformes aux exigences administratives et aux directions des ressources humaines en Afrique (PDF et Word).
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">Lettres de Motivation STAR</strong>
                Rédaction assistée par IA structurant le parcours du candidat selon la méthode reconnue STAR (Situation, Tâche, Action, Résultat).
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">Portfolios Web Interactifs</strong>
                Site web personnel hébergé en ligne avec Dark/Light mode, timeline dynamique et formulaire de contact direct pour les recruteurs.
              </div>
            </div>
          </section>

          {/* Article 4 */}
          <section id="art4" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">Article 4.</span>
              <span>Compte Utilisateur, Confidentialité & Sécurité</span>
            </h2>
            <p>
              Pour sauvegarder ses créations, l'utilisateur crée un compte personnel en fournissant des informations exactes. L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion.
            </p>
            <p>
              <strong>Isolation stricte :</strong> Conformément aux règles de sécurité mises en place par <strong>INNOVA GROUP</strong>, chaque utilisateur a accès exclusivement à ses propres CVs et candidatures. Aucun tiers ou autre utilisateur de la plateforme ne peut consulter les documents privés d'un autre candidat à moins que ce dernier n'ait explicitement partagé son lien public de portfolio.
            </p>
          </section>

          {/* Article 5 */}
          <section id="art5" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">Article 5.</span>
              <span>Tarification & Modalités de Paiement Mobile Money</span>
            </h2>
            <p>
              MonCV.ai propose une formule gratuite de découverte ainsi que des packs payants sans abonnement caché (paiement unique à l'acte) :
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Pack Découverte (0 FCFA) :</strong> Permet de tester le questionnaire IA et de visualiser le rendu du CV. Téléchargement PDF désactivé.</li>
              <li><strong>Pack Essentiel (1 500 FCFA) :</strong> Téléchargement illimité du CV en PDF HD sans aucun filigrane.</li>
              <li><strong>Pack Pro Recommandé (2 500 FCFA) :</strong> Inclut le CV PDF HD, la Demande d'Emploi officielle (PDF + Word) et la Lettre de motivation IA.</li>
              <li><strong>Pack VIP & Portfolio (5 000 FCFA) :</strong> Comprend l'intégralité des outils, le Portfolio Web interactif en ligne, les exports multi-formats et le support prioritaire.</li>
            </ul>
            <p className="pt-2">
              <strong>Moyens de Paiement :</strong> Les transactions sont opérées de façon hautement sécurisée via les passerelles de Mobile Money leaders en Afrique (Wave, Orange Money, MTN Mobile Money, Moov Money) ainsi que par carte bancaire.
            </p>
            <p className="text-[11px] text-slate-500 italic">
              Conformément à la législation sur le commerce électronique, s'agissant de contenus numériques fournis immédiatement après paiement, l'utilisateur accepte expressément que l'exécution commence dès la validation du paiement et renonce à son droit de rétractation après génération des documents.
            </p>
          </section>

          {/* Article 6 */}
          <section id="art6" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">Article 6.</span>
              <span>Utilisation de l'Intelligence Artificielle & Contenus</span>
            </h2>
            <p>
              Les suggestions de textes, les reformulations STAR et les calculs de score ATS sont fournis à titre d'assistance rédactionnelle. L'utilisateur demeure le garant exclusif de la véracité et de l'authenticité de ses diplômes, certifications et expériences professionnelles. <strong>INNOVA GROUP</strong> ne saurait être tenu responsable d'éventuelles inexactitudes saisies par l'utilisateur.
            </p>
          </section>

          {/* Article 7 */}
          <section id="art7" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">Article 7.</span>
              <span>Propriété Intellectuelle</span>
            </h2>
            <p>
              <strong>Droits d'INNOVA GROUP :</strong> L'ensemble des composantes du site et de l'application (marques, logos, codes sources, design systems, modèles visuels, graphismes) sont la propriété exclusive d'<strong>INNOVA GROUP</strong>. Toute reproduction ou rétro-ingénierie non autorisée fera l'objet de poursuites judiciaires.
            </p>
            <p>
              <strong>Droits de l'Utilisateur :</strong> L'utilisateur conserve la pleine et entière propriété des informations personnelles et des contenus textuels qu'il saisit dans ses documents.
            </p>
          </section>

          {/* Article 8 */}
          <section id="art8" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">Article 8.</span>
              <span>Protection des Données Personnelles & Confidentialité</span>
            </h2>
            <p>
              <strong>INNOVA GROUP</strong> applique une politique de confidentialité stricte conforme aux meilleures pratiques internationales (RGPD) et aux réglementations locales relatives à la protection des données à caractère personnel. Vos données ne sont jamais vendues, cédées ou exploitées à des fins publicitaires tierces.
            </p>
            <p>
              Vous bénéficiez d'un droit d'accès, de rectification et de suppression totale de vos données sur simple demande via les paramètres de votre compte ou par email.
            </p>
          </section>

          {/* Article 9 */}
          <section id="art9" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">Article 9.</span>
              <span>Disponibilité du Service & SLA</span>
            </h2>
            <p>
              <strong>INNOVA GROUP</strong> met en œuvre tous les moyens raisonnables pour assurer une disponibilité continue du service 24h/24 et 7j/7 avec un objectif de disponibilité de 99.9%. Des interruptions programmées de courte durée peuvent être effectuées pour assurer les mises à jour et la maintenance de la sécurité.
            </p>
          </section>

          {/* Article 10 */}
          <section id="art10" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">Article 10.</span>
              <span>Nous Contacter & Service Client</span>
            </h2>
            <p>
              Pour toute question relative aux présentes Conditions Générales d'Utilisation, pour signaler un problème technique ou formuler une demande de partenariat :
            </p>
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">Support Client INNOVA GROUP :</p>
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email officiel : <strong>support@moncv.ai</strong> / <strong>contact@innovagroup.io</strong></span>
              </p>
              <p className="flex items-center gap-2 text-slate-700">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Assistance WhatsApp Directe : <strong>Disponible 7j/7</strong></span>
              </p>
            </div>
          </section>
        </div>

        {/* Pied de page document */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 MonCV.ai — Conçu & Développé par <strong>INNOVA GROUP</strong>. Tous droits réservés.</p>
          <Link href="/contact" className="text-blue-600 font-bold hover:underline">
            Accéder à la section Nous Contacter →
          </Link>
        </div>
      </main>
    </div>
  );
}
