"use client";

import { useState } from "react";
import { useSubscription } from "@/lib/subscription/SubscriptionContext";

export function useDemoAction() {
  const sub = useSubscription();
  const isDemo = sub?.isDemoMode ?? false;

  const [modalOpen, setModalOpen] = useState(false);
  const [actionLabel, setActionLabel] = useState<string | undefined>(undefined);

  function interceptAction(callback: () => void, label?: string) {
    if (isDemo) {
      setActionLabel(label);
      setModalOpen(true);
    } else {
      callback();
    }
  }

  function closeModal() {
    setModalOpen(false);
    setActionLabel(undefined);
  }

  return { isDemo, interceptAction, modalOpen, actionLabel, closeModal };
}
