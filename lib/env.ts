/**
 * MonCV.ai - Gestionnaire Sécurisé des Variables d'Environnement
 * 
 * Les clés secrètes (API IA, secrets de paiement Mobile Money, tokens) ne sont 
 * JAMAIS exposées au navigateur client et restent protégées côté serveur.
 */

export const env = {
  // Configuration de base
  isProduction: process.env.NODE_ENV === "production",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Authentification & Chiffrement
  authSecret: process.env.NEXTAUTH_SECRET || "moncv_default_dev_secret_replace_in_prod",

  // Moteurs d'Intelligence Artificielle
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
    hasOpenAI: Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("votre_cle")),
    hasGemini: Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("votre_cle")),
  },

  // Passerelles Mobile Money (Côte d'Ivoire, Sénégal, UEMOA)
  payments: {
    waveApiKey: process.env.WAVE_API_KEY || "",
    waveWebhookSecret: process.env.WAVE_WEBHOOK_SECRET || "",
    orangeMoneyClientId: process.env.ORANGE_MONEY_CLIENT_ID || "",
    orangeMoneyClientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET || "",
    mtnMomoApiKey: process.env.MTN_MOMO_API_KEY || "",
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
    paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
  },

  // Emails transactionnels
  email: {
    resendApiKey: process.env.RESEND_API_KEY || "",
    from: process.env.EMAIL_FROM || "MonCV.ai <notifications@moncv.ai>",
  },

  // Base de données
  databaseUrl: process.env.DATABASE_URL || "",
};
