"use client";

import liff from "@line/liff";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LINE_PROFILE_STORAGE_KEY = "mfl:line-profile";

export type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

type LiffContextValue = {
  ready: boolean;
  inLine: boolean;
  profile: LineProfile | null;
};

const LiffContext = createContext<LiffContextValue>({
  ready: true,
  inLine: false,
  profile: null
});

function readStoredProfile(): LineProfile | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LINE_PROFILE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LineProfile;
  } catch {
    return null;
  }
}

function storeProfile(profile: LineProfile | null) {
  if (typeof window === "undefined") return;
  if (!profile) {
    sessionStorage.removeItem(LINE_PROFILE_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(LINE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [inLine, setInLine] = useState(false);
  const [profile, setProfile] = useState<LineProfile | null>(null);

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
    const stored = readStoredProfile();
    if (stored) setProfile(stored);

    if (!liffId) {
      setReady(true);
      return;
    }

    let cancelled = false;

    liff
      .init({ liffId })
      .then(async () => {
        if (cancelled) return;

        const isInClient = liff.isInClient();
        setInLine(isInClient);

        if (!liff.isLoggedIn()) {
          if (isInClient) {
            liff.login({ redirectUri: window.location.href });
          }
          return;
        }

        const nextProfile = await liff.getProfile();
        const mapped: LineProfile = {
          userId: nextProfile.userId,
          displayName: nextProfile.displayName,
          pictureUrl: nextProfile.pictureUrl
        };
        setProfile(mapped);
        storeProfile(mapped);
      })
      .catch((error) => {
        console.error("[LIFF] init failed", error);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      ready,
      inLine,
      profile
    }),
    [ready, inLine, profile]
  );

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}

export function useLiff() {
  return useContext(LiffContext);
}

export function getStoredLineProfile(): LineProfile | null {
  return readStoredProfile();
}
