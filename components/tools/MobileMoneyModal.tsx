"use client";

import React from "react";
import { PlanTier } from "@/lib/types";
import { WavePaymentClaimModal } from "./WavePaymentClaimModal";

interface MobileMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultPlan?: PlanTier;
  initialWaveOpened?: boolean;
}

/**
 * MobileMoneyModal - Modal de paiement et recharge Wave CI officiel
 * Affiche l'interface de paiement sécurisée Wave avec QR Code, lien direct
 * et validation de transaction. Ne génère aucune facture au simple clic d'ouverture.
 */
export const MobileMoneyModal: React.FC<MobileMoneyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPlan = "2500",
}) => {
  return (
    <WavePaymentClaimModal
      isOpen={isOpen}
      onClose={onClose}
      defaultPackCode={defaultPlan}
      onSuccess={onSuccess}
    />
  );
};
