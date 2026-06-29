"use client";

import liff from "@line/liff";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getLiffEndpointUrl, getLiffId, hasLiffId } from "@/lib/line/env";
import type { LineProfile } from "@/lib/line/profile";

export type { LineProfile };

const LINE_PROFILE_STORAGE_KEY = "mfl:line-profile";

let liffInitPromise: Promise<void> | null = null;

type LiffContextValue = {
  ready: boolean;
  inLine: boolean;
  profile: LineProfile | null;
  initError: string | null;
  liffIdConfigured: boolean;
};

const LiffContext = createContext<LiffContextValue>({
  ready: true,
  inLine: false,
  profile: null,
  initError: null,
  liffIdConfigured: false
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

export async function ensureLiffInit(): Promise<boolean> {
  const liffId = getLiffId();
  if (!liffId || typeof window === "undefined") return false;

  if (!liffInitPromise) {
    liffInitPromise = liff
      .init({ liffId })
      .then(() => {
        console.log("[LIFF] initialized");
        console.log("[LIFF] isInClient", liff.isInClient());
      })
      .catch((error) => {
        liffInitPromise = null;
        throw error;
      });
  }

  await liffInitPromise;
  return true;
}

async function fetchLiffProfile(): Promise<LineProfile | null> {
  const initialized = await ensureLiffInit();
  if (!initialized) return readStoredProfile();

  if (!liff.isLoggedIn()) {
    if (liff.isInClient()) {
      liff.login({ redirectUri: getLiffEndpointUrl() });
    }
    return readStoredProfile();
  }

  const nextProfile = mapProfile(await liff.getProfile());
  console.log("[LIFF] profile", nextProfile);
  storeProfile(nextProfile);
  return nextProfile;
}

export async function refreshLineProfile(): Promise<LineProfile | null> {
  try {
    return await fetchLiffProfile();
  } catch (error) {
    console.error("[LIFF] refreshLineProfile failed", error);
    return readStoredProfile();
  }
}

/** Start LIFF login and return to the order confirmation page to finish linking. */
export async function startLineConnectLogin(orderCode: string): Promise<LineProfile | null> {
  const { getLineConnectRedirectUrl } = await import("@/lib/line/env");
  const initialized = await ensureLiffInit();
  if (!initialized) return null;

  const redirectUri = getLineConnectRedirectUrl(orderCode);

  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri });
    return null;
  }

  return refreshLineProfile();
}

/** Start LIFF login and return to the order summary page to claim a welcome coupon. */
export async function startSummaryLineConnect(): Promise<LineProfile | null> {
  const { getSummaryLineConnectRedirectUrl } = await import("@/lib/line/env");
  const initialized = await ensureLiffInit();
  if (!initialized) return null;

  const redirectUri = getSummaryLineConnectRedirectUrl();

  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri });
    return null;
  }

  return refreshLineProfile();
}

/** Start LIFF login and return to the payment page to claim a welcome coupon. */
export async function startPaymentLineConnect(): Promise<LineProfile | null> {
  const { getPaymentLineConnectRedirectUrl } = await import("@/lib/line/env");
  const initialized = await ensureLiffInit();
  if (!initialized) return null;

  const redirectUri = getPaymentLineConnectRedirectUrl();

  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri });
    return null;
  }

  return refreshLineProfile();
}

/** Start LIFF login and return to customer info step. */
export async function startCustomerInfoLineConnect(): Promise<LineProfile | null> {
  const { getCustomerInfoLineConnectRedirectUrl } = await import("@/lib/line/env");
  const initialized = await ensureLiffInit();
  if (!initialized) return null;

  const redirectUri = getCustomerInfoLineConnectRedirectUrl();

  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri });
    return null;
  }

  return refreshLineProfile();
}

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [inLine, setInLine] = useState(false);
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const liffIdConfigured = hasLiffId();

  useEffect(() => {
    const stored = readStoredProfile();
    if (stored) setProfile(stored);

    if (!liffIdConfigured) {
      setReady(true);
      return;
    }

    let cancelled = false;

    fetchLiffProfile()
      .then((nextProfile) => {
        if (cancelled) return;
        setInLine(liff.isInClient());
        if (nextProfile) setProfile(nextProfile);
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
  }, [liffIdConfigured]);

  const value = useMemo(
    () => ({
      ready,
      inLine,
      profile,
      initError,
      liffIdConfigured
    }),
    [ready, inLine, profile, initError, liffIdConfigured]
  );

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}

export function useLiff() {
  return useContext(LiffContext);
}

export function getStoredLineProfile(): LineProfile | null {
  return readStoredProfile();
}
