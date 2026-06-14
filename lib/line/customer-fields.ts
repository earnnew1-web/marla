import type { LineProfile } from "@/lib/line/profile";
import type { Customer, CustomerDraft } from "@/lib/types";

export function resolveLineProfile(
  profile: LineProfile | null | undefined,
  draft?: CustomerDraft | null
): LineProfile | null {
  if (profile?.userId) return profile;

  if (draft?.lineUserId?.trim()) {
    return {
      userId: draft.lineUserId.trim(),
      displayName: draft.lineDisplayName?.trim() || draft.lineUserId.trim(),
      pictureUrl: draft.linePictureUrl ?? undefined
    };
  }

  return null;
}

/** Merge LIFF profile into the customer draft. LIFF fields override manual LINE ID for push. */
export function applyLineProfileToCustomer(
  customer: CustomerDraft,
  profile: LineProfile | null | undefined
): CustomerDraft {
  if (!profile?.userId) {
    return {
      ...customer,
      lineConnected: customer.lineConnected ?? Boolean(customer.lineUserId?.trim())
    };
  }

  return {
    ...customer,
    lineUserId: profile.userId,
    lineDisplayName: profile.displayName,
    linePictureUrl: profile.pictureUrl ?? null,
    lineConnected: true,
    lineId: profile.displayName
  };
}

export function buildLineSubmitPayload(customer: CustomerDraft) {
  return {
    line_user_id: customer.lineUserId ?? null,
    line_display_name: customer.lineDisplayName ?? null,
    line_picture_url: customer.linePictureUrl ?? null,
    line_connected: Boolean(customer.lineUserId?.trim())
  };
}

export function customerLineLabel(customer?: Customer | CustomerDraft | null): string | undefined {
  if (!customer) return undefined;
  return customer.lineDisplayName?.trim() || customer.lineId?.trim() || undefined;
}

export function customerLineDbFields(customer: CustomerDraft) {
  const lineUserId = customer.lineUserId?.trim();

  if (lineUserId) {
    return {
      line_id: customer.lineDisplayName?.trim() || lineUserId,
      line_user_id: lineUserId,
      line_display_name: customer.lineDisplayName?.trim() || null,
      line_picture_url: customer.linePictureUrl?.trim() || null,
      line_connected: true
    };
  }

  return {
    line_id: customer.lineId?.trim() || "-",
    line_user_id: null,
    line_display_name: null,
    line_picture_url: null,
    line_connected: false
  };
}
