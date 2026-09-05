import { ResumeData } from "./types";

export const initialResumeData: ResumeData = {
  id: "cv-jean-kouassi-01",
  title: "CV Commercial & Ventes B2B",
  updatedAt: new Date().toISOString(),
  targetProfile: "professional",
  language: "fr",
  slug: "jean-kouassi-commercial",
  isPremium: false,
  personal: {
    firstName: "Jean",
    lastName: "Kouassi",
    title: "Commercial & Responsable Développement des Ventes",
    email: "jean.kouassi@email.com",
    phone: "+225 07 00 11 22 33",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    birthDate: "15/04/1995",
    birthPlace: "Abidjan",
    maritalStatus: "Célibataire",
    linkedin: "linkedin.com/in/jean-kouassi",
    website: "jean-kouassi.pro",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
  },
  summary:
    "Commercial dynamique et orienté résultats avec plus de 3 années d'expérience dans le développement commercial B2B/B2C, la négociation stratégique et la fidélisation client. Capacité démontrée à dépasser les objectifs de vente et à dynamiser la rentabilité des points de vente.",
  experiences: [
    {
      id: "exp-1",
      role: "Chargé de Clientèle & Ventes",
      company: "Ivoire Télécom Distribution",
      city: "Abidjan",
      country: "Côte d'Ivoire",
      startDate: "Janvier 2022",
      endDate: "Présent",
      current: true,
      rawInput: "Je vendais des téléphones et des forfaits pour les entreprises.",
      highlights: [
        "Développement et gestion d'un portefeuille de plus de 80 clients professionnels et particuliers.",
        "Dépassement régulier des objectifs mensuels de vente (+115% de réalisation en 2023).",
        "Conseil personnalisé, négociation d'offres télécoms et fidélisation avec un taux de rétention de 92%.",
        "Mise en place d'un reporting hebdomadaire sous CRM pour optimiser le suivi du pipeline de conversion."
      ],
    },
    {
      id: "exp-2",
      role: "Conseiller Commercial Junior",
      company: "TechStore Afrique",
      city: "Abidjan",
      startDate: "Juin 2020",
      endDate: "Décembre 2021",
      current: false,
      rawInput: "Accueil des clients et vente en boutique.",
      highlights: [
        "Accueil, orientation et identification proactive des besoins des clients en boutique physique.",
        "Gestion des stocks, merchandising et valorisation visuelle des produits high-tech.",
        "Contribution à une augmentation de 18% du chiffre d'affaires du rayon smartphones et accessoires."
      ],
    },
  ],
  educations: [
    {
      id: "edu-1",
      degree: "Licence Professionnelle",
      field: "Marketing & Action Commerciale",
      school: "Institut Supérieur de Commerce & Management (INP-HB / Université)",
      city: "Abidjan",
      year: "2020",
    },
    {
      id: "edu-2",
      degree: "Baccalauréat Série G2",
      field: "Gestion & Comptabilité",
      school: "Lycée Technique",
      city: "Abidjan",
      year: "2017",
    },
  ],
  skills: [
    {
      id: "sk-1",
      category: "Compétences Commerciales",
      items: [
        "Prospection B2B & B2C",
        "Négociation & Clôture",
        "Gestion de la Relation Client (CRM)",
        "Développement de Portefeuille",
        "Techniques de Vente Conseil"
      ],
    },
    {
      id: "sk-2",
      category: "Outils & Logiciels",
      items: [
        "Microsoft Excel (Avancé)",
        "Salesforce / HubSpot CRM",
        "Canva Pro",
        "Microsoft Word & PowerPoint",
        "Google Workspace"
      ],
    },
    {
      id: "sk-3",
      category: "Savoir-être (Soft Skills)",
      items: [
        "Sens de l'écoute active",
        "Orientation résultats",
        "Aisance relationnelle",
        "Gestion du stress & Adaptabilité"
      ],
    },
  ],
  languages: [
    {
      id: "lang-1",
      name: "Français",
      level: "Bilingue / Natif",
    },
    {
      id: "lang-2",
      name: "Anglais",
      level: "Intermédiaire",
    },
  ],
  sections: {
    certifications: [
      {
        id: "cert-1",
        title: "Certification HubSpot Inbound Sales",
        issuer: "HubSpot Academy",
        year: "2023",
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "Lancement de la Gamme SmartPro",
        description: "Coordination d'une campagne terrain ayant généré 45 nouveaux comptes clients en 60 jours.",
      },
    ],
    interests: [
      "Veille économique & nouvelles technologies",
      "Basketball",
      "Lecture (Développement personnel & Négociation)"
    ],
    references: [
      {
        id: "ref-1",
        name: "M. Kouamé Patrice",
        role: "Directeur Commercial",
        company: "Ivoire Télécom",
        contact: "+225 07 12 34 56"
      }
    ],
    volunteer: [
      {
        id: "vol-1",
        role: "Mentor Bénévole",
        organization: "Association Jeunesse & Avenir",
        period: "2022 - Présent"
      }
    ]
  },
  design: {
    template: "modern",
    primaryColor: "#2563eb",
    fontFamily: "sans",
    showPhoto: true,
    spacing: "normal",
  },
};
