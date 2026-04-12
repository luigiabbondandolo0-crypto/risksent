"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSubscriptionClient } from "./getSubscriptionClient";
import type { SubscriptionInfo } from "./getSubscription";

type SubscriptionContextValue = {
  subscription: SubscriptionInfo | null;
  refreshSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  const refreshSubscription = useCallback(async () => {
    try {
      const next = await getSubscriptionClient();
      setSubscription(next);
    } catch {
      /* keep previous subscription on failure */
    }
  }, []);

  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  const value = useMemo(
    () => ({ subscription, refreshSubscription }),
    [subscription, refreshSubscription]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionInfo | null {
  const ctx = useContext(SubscriptionContext);
  return ctx?.subscription ?? null;
}

/** Refetch subscription from the API (e.g. after start-trial) so UI updates without a full reload. */
export function useRefreshSubscription(): () => Promise<void> {
  const ctx = useContext(SubscriptionContext);
  return ctx?.refreshSubscription ?? (async () => {});
}
