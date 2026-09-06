# 🔐 ACCÈS ET GUIDE DE LA CONSOLE D'ADMINISTRATION MONCV.AI
**CONFIDENTIEL — RÉSERVÉ STRICTEMENT AU SUPER ADMINISTRATEUR / DIRECTION INNOVA GROUP**

Ce dossier contient les identifiants d'accès maîtres, les clés de sécurité et les instructions d'exploitation de la console d'administration centrale de la plateforme MonCV.ai éditée par **INNOVA GROUP**.

---

## 📞 Coordonnées Officielles de l'Éditeur (INNOVA GROUP)
- **WhatsApp Officiel Support & Direction** : `+225 07 00 51 05 24` (`0700510524`)
- **Email Officiel Direction** : `innovagroup225@gmail.com`

---

## 🌐 1. Adresse d'Accès Direct (URL)

| Environnement | Lien d'accès direct |
| :--- | :--- |
| **Serveur Local (Développement / Staging)** | [http://localhost:3000/admin](http://localhost:3000/admin) |
| **Production (Web)** | `https://votre-domaine.com/admin` |

---

## 🔑 2. Identifiants & Passphrase SuperAdmin (Niveau Militaire)

Pour déverrouiller la console d'administration, vous disposez de **deux méthodes au choix** :

### Option A : Déverrouillage Direct par Clé Maître (Master Passkey)
> Idéal pour une connexion instantanée en 1 clic sans devoir saisir d'adresse email.

- **Passphrase Maître Principale (Haute Entropie)** :
  ```
  INNOVA#2026@MonCV-SuperVault$Secure987!
  ```
- **Passphrases de secours alternatives reconnues** :
  ```
  INNOVA-SUPERADMIN-2026
  MonCV2026Admin!
  ```

### Option B : Connexion par Identifiant & Mot de Passe Administrateur
- **Adresses Email Administrateur Autorisées** :
  ```
  innovagroup225@gmail.com
  admin@moncv.ai
  ```
- **Mot de Passe Administrateur** :
  ```
  INNOVA#2026@MonCV-SuperVault$Secure987!
  ```
  *(ou mot de passe alternatif : `Admin2026!`)*

---

## 🛡️ 3. Sécurité & Protection Intégrée

- **Vérification Côté Serveur** : Route API `/api/admin/auth` avec hachage SHA-256 et comparaison temporelle constante (`crypto.timingSafeEqual`) pour neutraliser toute tentative d'analyse par canal auxiliaire (*timing attacks*).
- **Protection Anti-Brute-Force Stricte** :
  - Maximum **3 tentatives consécutives autorisées**.
  - En cas de 3 échecs consécutifs, l'adresse IP est temporairement verrouillée pendant **15 minutes** avec affichage d'un compte à rebours de sécurité.
- **Jetons de Session HMAC** : Session administrateur signée cryptographiquement et inviolable.

---

## 🚀 4. Présentation des 5 Modules de la Console (/admin)

1. **📊 Vue d'Ensemble & Métriques 360°** :
   - Indicateurs en direct : Total utilisateurs inscrits (Candidats vs Entreprises vs Admins).
   - Nombre total de CVs créés et stockés dans le système.
   - **Chiffre d'Affaires en FCFA** avec décomposition par formule :
     - *Essentiel* : 1 500 FCFA
     - *Pro* : 2 500 FCFA
     - *VIP* : 5 000 FCFA
     - *Cyber Pro* : 15 000 FCFA
     - *Starter RH* : 30 000 FCFA
     - *Business RH* : 75 000 FCFA
     - *Entreprise Illimitée* : 200 000 FCFA
   - Taux de conversion global et score de conformité ATS moyen.
   - Journal d'audit en direct (Live Audit Stream).

2. **👥 Gestion des Utilisateurs & Viviers** :
   - Recherche instantanée par nom, email, téléphone, entreprise.
   - Filtres par rôle (*Candidat*, *Entreprise*, *Admin*) et par formule.
   - **Surclassement de formule en 1 clic** (ex: accorder VIP ou Entreprise manuellement).
   - **Réinitialisation du mot de passe** pour dépanner un utilisateur bloqué.
   - **Suspension / Réactivation** immédiate d'un compte suspect.
   - **Suppression définitive sécurisée**.
   - **Exportation complète en CSV** (`moncv_export_utilisateurs.csv`).

3. **💼 Abonnements & Viviers Entreprises B2B** :
   - Suivi des licences professionnelles et des quotas consommés (15, 30, 75, 200 candidats).
   - Données légales de l'entreprise (RCCM, adresse, gérant, téléphone WhatsApp).

4. **🩺 Diagnostic Proactif des Incidents (Auto-Scan)** :
   - Scanner en 6 points de contrôle d'intégrité :
     1. Intégrité des abonnements payants.
     2. Indexation des CVs et détection des orphelins.
     3. Respect des quotas vivier entreprise.
     4. Disponibilité de la base Cloud Supabase PostgreSQL.
     5. État des endpoints de génération IA.
     6. Intégrité du stockage local et détection de corruptions.

5. **🛠️ Correctifs en 1 Clic (Auto-Heal & Maintenance)** :
   - **"Réparer & Resynchroniser les Abonnements"** : consolide et réécrit les clés manquantes.
   - **"Rattacher les CVs Orphelins"** : réindexe automatiquement les CVs sans propriétaire.
   - **"Nettoyer & Compacter le Stockage"** : purge les clés temporaires et obsolètes.
   - **"Mode Maintenance"** : active un bandeau d'information pour les visiteurs.
   - **"Générer des Données Démo"** : crée 1 profil VIP et 1 entreprise pour vos présentations.

---
*MonCV.ai — Direction Technique & Administration Système • INNOVA GROUP*
