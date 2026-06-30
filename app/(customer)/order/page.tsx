"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLiff } from "@/components/line/LiffProvider";
import { applyLineProfileToCustomer } from "@/lib/line/customer-fields";
import { loadDraft, saveDraft } from "@/lib/storage";

const LINE_PROFILE_TIMEOUT_MS = 4000;

export default function OrderEntryPage() {
  const router = useRouter();
  const { ready, inLine, profile, initError } = useLiff();

  useEffect(() => {
    if (!ready) return;

    if (profile?.userId) {
      const draft = loadDraft();
      saveDraft({
        ...draft,
        customer: applyLineProfileToCustomer(
          draft.customer ?? { name: "", phone: "", email: "" },
          profile
        )
      });
    }

    if (!inLine || profile?.userId) {
      router.replace("/order/film-rolls");
      return;
    }

    const timeout = window.setTimeout(() => {
      router.replace("/order/film-rolls");
    }, LINE_PROFILE_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [ready, inLine, profile?.userId, router]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-foreground">Marla Film Lab</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {initError ? "Could not connect to LINE." : "Connecting to LINE..."}
      </p>
    </main>
  );
}
