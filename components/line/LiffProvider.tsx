"use client";

import liff from "@line/liff";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getLiffEndpointUrl, getLiffId } from "@/lib/line/env";

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
  initError: string | null;
};

const LiffContext = createContext<LiffContextValue>({
  ready: true,
  inLine: false,
  profile: null,
  initError: null
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

function mapProfile(nextProfile: { userId: string; displayName: string; pictureUrl?: string }): LineProfile {
  return {
    userId: nextProfile.userId,
    displayName: nextProfile.displayName,
    pictureUrl: nextProfile.pictureUrl
  };
}

export async function refreshLineProfile(): Promise<LineProfile | null> {
  const liffId = getLiffId();
  if (!liffId || typeof window === "undefined") {
    return readStoredProfile();
  }

  try {
    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      return readStoredProfile();
    }

    const nextProfile = mapProfile(await liff.getProfile());
    storeProfile(nextProfile);
    return nextProfile;
  } catch (error) {
    console.error("[LIFF] refreshLineProfile failed", error);
    return readStoredProfile();
  }
}

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [inLine, setInLine] = useState(false);
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const liffId = getLiffId();
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
        console.info("[LIFF] initialized", {
          isInClient,
          isLoggedIn: liff.isLoggedIn(),
          endpoint: getLiffEndpointUrl()
        });

        if (!liff.isLoggedIn()) {
          if (isInClient) {
            liff.login({ redirectUri: getLiffEndpointUrl() });
          }
          return;
        }

        const nextProfile = mapProfile(await liff.getProfile());
        setProfile(nextProfile);
        storeProfile(nextProfile);
        console.info("[LIFF] profile loaded", { userId: nextProfile.userId });
      })
      .catch((error) => {
        console.error("[LIFF] init failed", error);
        if (!cancelled) {
          setInitError(error instanceof Error ? error.message : "LIFF init failed");
        }
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
      profile,
      initError
    }),
    [ready, inLine, profile, initError]
  );

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}

export function useLiff() {
  return useContext(LiffContext);
}

export function getStoredLineProfile(): LineProfile | null {
  return readStoredProfile();
}
