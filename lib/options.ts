import type { FileDelivery, FilmReturn, OrderStatus } from "@/lib/types";

export const fileDeliveryOptions: FileDelivery[] = ["Google Drive", "Email", "LINE"];
export const filmReturnOptions: FilmReturn[] = ["Pick up at store", "Delivery (+60 THB)"];

export const orderStatuses: OrderStatus[] = [
  "Pending Payment Confirmation",
  "Received",
  "Developing+Scanning",
  "Ready",
  "Completed",
  "Cancelled"
];

export const orderStatusLabels: Record<OrderStatus, { en: string; th: string }> = {
  "Pending Payment Confirmation": {
    en: "Pending Payment Confirmation",
    th: "รอยืนยันการชำระเงิน"
  },
  Received: { en: "Received", th: "รับฟิล์ม" },
  "Developing+Scanning": { en: "Developing + Scanning", th: "กำลังล้าง" },
  Ready: { en: "Ready", th: "พร้อมแล้ว" },
  Completed: { en: "Completed", th: "เสร็จสิ้น" },
  Cancelled: { en: "Cancelled", th: "ยกเลิก" }
};

export type AdminStatusFilter = "All" | OrderStatus | "Developing+Scanning";

export const adminStatusFilters: AdminStatusFilter[] = [
  "All",
  "Pending Payment Confirmation",
  "Received",
  "Developing+Scanning",
  "Ready",
  "Completed",
  "Cancelled"
];
