"use client";

import React, { useEffect } from "react";
import { PlanTier } from "@/lib/types";
import { StorageManager } from "@/lib/storage";

interface MobileMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPlan?: PlanTier;
  initialWaveOpened?: boolean;
}

/**
 * MobileMoneyModal — Désactivé & Remplacé par l'Accès Libre et Gratuit
 * Toutes les fonctionnalités (PDF HD, Word sans filigrane,
 * Lettres IA, Viviers RH) sont débloquées sans étape de paiement.
 */
export const MobileMoneyModal: React.FC<MobileMoneyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPlan = "2500",
}) => {
  useEffect(() => {
    if (isOpen) {
      StorageManager.setPlanTier(defaultPlan, {
        status: "active",
        paymentMethod: "Accès Libre & Gratuit",
      });
      onSuccess?.();
      onClose?.();
    }
  }, [isOpen, defaultPlan, onSuccess, onClose]);

  return null;
};
