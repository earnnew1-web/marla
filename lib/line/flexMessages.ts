import { getLineOaUrl, getSiteUrl } from "@/lib/line/env";
import {
  LAB_ADDRESS_COPY_TEXT,
  LAB_ADDRESS_LINE,
  LAB_NAME,
  LAB_PHONE_DISPLAY
} from "@/lib/lab-address";
import { ORDER_PROGRESS_STEPS } from "@/lib/order-progress";
import { LINE_STATUS_COPY, type LineStatusKey } from "@/lib/line/status";
import type { FilmDeliveryMethod } from "@/lib/types";

const BRAND = {
  ink: "#2B211C",
  paper: "#FAF7F2",
  muted: "#8A7A70",
  border: "#E8DFD6"
} as const;

export type FlexOrderInput = {
  orderCode: string;
  totalPrice: number;
  customerPhone: string;
  statusKey: LineStatusKey;
  scanDriveUrl?: string | null;
  filmDeliveryMethod?: FilmDeliveryMethod;
};

function statusHeroImagePath(statusKey: LineStatusKey) {
  switch (statusKey) {
    case "developing_scanning":
      return ORDER_PROGRESS_STEPS[1].image;
    case "ready":
      return ORDER_PROGRESS_STEPS[2].image;
    case "completed":
      return ORDER_PROGRESS_STEPS[3].image;
    case "cancelled":
      return ORDER_PROGRESS_STEPS[0].image;
    default:
      return ORDER_PROGRESS_STEPS[0].image;
  }
}

function statusHeroUrl(statusKey: LineStatusKey) {
  return `${getSiteUrl()}${statusHeroImagePath(statusKey)}`;
}

function infoRow(label: string, value: string) {
  return {
    type: "box" as const,
    layout: "baseline" as const,
    spacing: "sm" as const,
    margin: "md" as const,
    contents: [
      {
        type: "text" as const,
        text: label,
        color: BRAND.muted,
        size: "sm" as const,
        flex: 2
      },
      {
        type: "text" as const,
        text: value,
        wrap: true,
        size: "sm" as const,
        weight: "bold" as const,
        color: BRAND.ink,
        flex: 5
      }
    ]
  };
}

function parcelShippingSection() {
  return [
    {
      type: "separator" as const,
      margin: "lg" as const,
      color: BRAND.border
    },
    {
      type: "text" as const,
      text: "Ship your film to",
      size: "sm" as const,
      weight: "bold" as const,
      color: BRAND.ink,
      margin: "md" as const
    },
    {
      type: "text" as const,
      text: LAB_NAME,
      size: "sm" as const,
      weight: "bold" as const,
      color: BRAND.ink,
      margin: "sm" as const,
      wrap: true
    },
    {
      type: "text" as const,
      text: LAB_ADDRESS_LINE,
      size: "sm" as const,
      color: BRAND.ink,
      margin: "sm" as const,
      wrap: true
    },
    {
      type: "text" as const,
      text: LAB_PHONE_DISPLAY,
      size: "sm" as const,
      color: BRAND.muted,
      margin: "sm" as const,
      wrap: true
    },
    {
      type: "button" as const,
      style: "link" as const,
      height: "sm" as const,
      margin: "md" as const,
      action: {
        type: "clipboard" as const,
        label: "Copy Address",
        clipboardText: LAB_ADDRESS_COPY_TEXT
      }
    }
  ];
}

export function buildOrderStatusFlex(order: FlexOrderInput) {
  const copy = LINE_STATUS_COPY[order.statusKey];
  const scanDriveUrl = order.scanDriveUrl?.trim();
  const showParcelShipping = order.filmDeliveryMethod === "parcel";
  const footerButtons = [];

  if (scanDriveUrl && (order.statusKey === "ready" || order.statusKey === "completed")) {
    footerButtons.push({
      type: "button" as const,
      style: "primary" as const,
      color: "#C45C4A",
      height: "sm" as const,
      action: {
        type: "uri" as const,
        label: "Open Google Drive",
        uri: scanDriveUrl
      }
    });
  }

  footerButtons.push({
    type: "button" as const,
    style: "secondary" as const,
    height: "sm" as const,
    action: {
      type: "uri" as const,
      label: "Contact Marla Film Lab",
      uri: getLineOaUrl()
    }
  });

  return {
    type: "flex" as const,
    altText: `${copy.statusLabel} · ${order.orderCode}`,
    contents: {
      type: "bubble" as const,
      size: "mega" as const,
      hero: {
        type: "image" as const,
        url: statusHeroUrl(order.statusKey),
        size: "full" as const,
        aspectRatio: "1:1" as const,
        aspectMode: "fit" as const,
        backgroundColor: BRAND.paper
      },
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        backgroundColor: BRAND.paper,
        paddingAll: "20px" as const,
        contents: [
          {
            type: "text" as const,
            text: copy.statusLabel,
            weight: "bold" as const,
            size: "xl" as const,
            color: BRAND.ink,
            wrap: true
          },
          {
            type: "text" as const,
            text: copy.description,
            size: "sm" as const,
            color: BRAND.muted,
            wrap: true,
            margin: "md" as const
          },
          ...(showParcelShipping ? parcelShippingSection() : []),
          {
            type: "separator" as const,
            margin: "lg" as const,
            color: BRAND.border
          },
          infoRow("Order No.", order.orderCode),
          infoRow("Total", `${order.totalPrice.toLocaleString("en-US")} THB`)
        ]
      },
      footer: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "sm" as const,
        backgroundColor: BRAND.paper,
        paddingAll: "16px" as const,
        contents: footerButtons
      }
    }
  };
}
