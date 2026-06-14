import type { LineProfile } from "@/components/line/LiffProvider";
import { getStoredLineProfile } from "@/components/line/LiffProvider";
import type { Customer, CustomerDraft } from "@/lib/types";

export function mergeCustomerLineProfile(
  customer: CustomerDraft,
  profile: LineProfile | null
): CustomerDraft {
  if (profile?.userId) {
    return {
      ...customer,
      lineUserId: profile.userId,
      lineDisplayName: profile.displayName,
      linePictureUrl: profile.pictureUrl ?? null,
      lineConnected: true,
      lineId: customer.lineId?.trim() || profile.displayName
    };
  }

  return {
    ...customer,
    lineConnected: customer.lineConnected ?? Boolean(customer.lineUserId?.trim())
  };
}

export function resolveActiveLineProfile(
  profile: LineProfile | null | undefined,
  draft?: CustomerDraft | null
): LineProfile | null {
  if (profile?.userId) return profile;

  const stored = getStoredLineProfile();
  if (stored?.userId) return stored;

  if (draft?.lineUserId?.trim()) {
    return {
      userId: draft.lineUserId.trim(),
      displayName: draft.lineDisplayName?.trim() || draft.lineUserId.trim(),
      pictureUrl: draft.linePictureUrl ?? undefined
    };
  }

  return null;
}

/** Resolve LIFF profile + keep draft LINE fields before order submit. */
export function finalizeCustomerLineFields(
  customer: CustomerDraft,
  profile?: LineProfile | null
): CustomerDraft {
  const activeProfile = profile ?? resolveActiveLineProfile(null, customer);
  const merged = mergeCustomerLineProfile(customer, activeProfile);
  const lineId =
    merged.lineId?.trim() ||
    merged.lineDisplayName?.trim() ||
    (merged.lineConnected ? activeProfile?.displayName : "") ||
    "";

  return {
    ...merged,
    lineId: lineId || merged.lineId
  };
}

export function customerLineLabel(customer?: Customer | CustomerDraft | null): string | undefined {
  if (!customer) return undefined;
  return customer.lineId?.trim() || customer.lineDisplayName?.trim() || undefined;
}

export function customerLineDbFields(customer: CustomerDraft) {
  const finalized = finalizeCustomerLineFields(customer);
  const lineId = finalized.lineId?.trim();

  if (finalized.lineConnected && finalized.lineUserId?.trim()) {
    return {
      line_id: lineId || finalized.lineDisplayName?.trim() || finalized.lineUserId.trim(),
      line_user_id: finalized.lineUserId.trim(),
      line_display_name: finalized.lineDisplayName?.trim() || null,
      line_picture_url: finalized.linePictureUrl?.trim() || null,
      line_connected: true
    };
  }

  return {
    line_id: lineId || "-",
    line_user_id: null,
    line_display_name: null,
    line_picture_url: null,
    line_connected: false
  };
}
