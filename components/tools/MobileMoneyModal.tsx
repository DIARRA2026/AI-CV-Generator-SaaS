"use client";

import React from "react";
import { PlanTier } from "@/lib/types";
import { KKiaPayWidgetModal } from "@/components/payment/KKiaPayWidget";

interface MobileMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultPlan?: PlanTier;
  initialWaveOpened?: boolean;
}

/**
 * MobileMoneyModal - Modal officiel de paiement sécurisé KKiaPay
 * Connecté au serveur Next.js avec vérification transactionnelle
 * RÈGLE 1 : Aucun lien statique, tout paiement est vérifié par le serveur.
 */
export const MobileMoneyModal: React.FC<MobileMoneyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPlan = "2500",
}) => {
  return (
    <KKiaPayWidgetModal
      isOpen={isOpen}
      onClose={onClose}
      planId={defaultPlan}
      onSuccess={onSuccess}
    />
  );
};
