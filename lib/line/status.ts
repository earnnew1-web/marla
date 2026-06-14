import type { OrderStatus } from "@/lib/types";

export type LineStatusKey =
  | "order_received"
  | "pending_payment_confirmation"
  | "received"
  | "developing_scanning"
  | "ready"
  | "completed"
  | "cancelled";

export const LINE_STATUS_COPY: Record<
  LineStatusKey,
  { title: string; statusLabel: string; description: string }
> = {
  order_received: {
    title: "รับออเดอร์เรียบร้อยแล้ว",
    statusLabel: "รับออเดอร์แล้ว",
    description: "Marla Film Lab ได้รับออเดอร์ของคุณแล้ว เราจะดำเนินการล้างและสแกนฟิล์มให้เร็วที่สุด"
  },
  pending_payment_confirmation: {
    title: "รับออเดอร์เรียบร้อยแล้ว",
    statusLabel: "รอชำระเงิน",
    description: "เราได้รับออเดอร์ของคุณแล้ว กรุณาชำระเงินที่หน้าร้านเมื่อมาส่งฟิล์ม"
  },
  received: {
    title: "อัปเดตสถานะออเดอร์",
    statusLabel: "📥 รับฟิล์มแล้ว",
    description: "ฟิล์มของคุณถึง Marla Film Lab แล้ว และอยู่ในคิวพร้อมดำเนินการ"
  },
  developing_scanning: {
    title: "อัปเดตสถานะออเดอร์",
    statusLabel: "🧪 กำลังล้างและสแกน",
    description: "ทีมงานกำลังล้างและสแกนฟิล์มของคุณอยู่ — ขอบคุณที่ไว้วางใจ Marla"
  },
  ready: {
    title: "อัปเดตสถานะออเดอร์",
    statusLabel: "✨ พร้อมแล้ว",
    description: "ไฟล์/ฟิล์มของคุณพร้อมแล้ว สามารถติดตามรายละเอียดหรือติดต่อร้านได้เลย"
  },
  completed: {
    title: "อัปเดตสถานะออเดอร์",
    statusLabel: "📦 เสร็จสิ้น",
    description: "ออเดอร์ของคุณเสร็จสมบูรณ์แล้ว ขอบคุณที่ใช้บริการ Marla Film Lab"
  },
  cancelled: {
    title: "อัปเดตสถานะออเดอร์",
    statusLabel: "⚠️ ยกเลิกออเดอร์",
    description: "ออเดอร์นี้ถูกยกเลิกแล้ว หากมีข้อสงสัยกรุณาติดต่อร้าน"
  }
};

export function orderStatusToLineKey(status: OrderStatus): LineStatusKey | null {
  switch (status) {
    case "Pending Payment Confirmation":
      return "pending_payment_confirmation";
    case "Received":
      return "received";
    case "Developing+Scanning":
      return "developing_scanning";
    case "Ready":
      return "ready";
    case "Completed":
      return "completed";
    case "Cancelled":
      return "cancelled";
    default:
      return null;
  }
}

export function parseLineStatusInput(status: string): LineStatusKey | null {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, "_");

  if (normalized in LINE_STATUS_COPY) {
    return normalized as LineStatusKey;
  }

  const fromOrderStatus: Record<string, LineStatusKey> = {
    "pending payment confirmation": "pending_payment_confirmation",
    pending_payment_confirmation: "pending_payment_confirmation",
    received: "received",
    "developing+scanning": "developing_scanning",
    "developing_scanning": "developing_scanning",
    ready: "ready",
    completed: "completed",
    cancelled: "cancelled",
    order_received: "order_received"
  };

  return fromOrderStatus[normalized] ?? null;
}

/** LINE status key for the confirmation Flex sent right after order submit. */
export function resolveSubmitLineStatusKey(status: OrderStatus): LineStatusKey {
  switch (status) {
    case "Pending Payment Confirmation":
      return "pending_payment_confirmation";
    case "Received":
      return "order_received";
    default:
      return orderStatusToLineKey(status) ?? "order_received";
  }
}
