"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSubscriptionClient } from "./getSubscriptionClient";
import type { SubscriptionInfo } from "./getSubscription";

const SubscriptionContext = createContext<SubscriptionInfo | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    getSubscriptionClient()
      .then(setSub)
      .catch(() => {});
  }, []);

  return (
    <SubscriptionContext.Provider value={sub}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionInfo | null {
  return useContext(SubscriptionContext);
}
