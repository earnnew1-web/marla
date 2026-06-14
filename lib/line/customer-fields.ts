import type { LineProfile } from "@/components/line/LiffProvider";
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
      lineConnected: true
    };
  }

  return {
    ...customer,
    lineUserId: null,
    lineDisplayName: null,
    linePictureUrl: null,
    lineConnected: false
  };
}

export function customerLineLabel(customer?: Customer | CustomerDraft | null): string | undefined {
  if (!customer) return undefined;
  if (customer.lineConnected) {
    return customer.lineDisplayName ?? customer.lineId ?? undefined;
  }
  return customer.lineId?.trim() || undefined;
}

export function customerLineDbFields(customer: CustomerDraft) {
  if (customer.lineConnected && customer.lineUserId?.trim()) {
    const displayName = customer.lineDisplayName?.trim();
    return {
      line_id: displayName || customer.lineUserId.trim(),
      line_user_id: customer.lineUserId.trim(),
      line_display_name: displayName || null,
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
