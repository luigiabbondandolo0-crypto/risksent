"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type UserPrefs = { timezone: string };

const UserPreferencesContext = createContext<UserPrefs>({ timezone: "local" });

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<UserPrefs>({ timezone: "local" });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { preferenceTimezone?: string } | null) => {
        if (data?.preferenceTimezone) {
          setPrefs({ timezone: data.preferenceTimezone });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <UserPreferencesContext.Provider value={prefs}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserTimezone(): string {
  return useContext(UserPreferencesContext).timezone;
}
