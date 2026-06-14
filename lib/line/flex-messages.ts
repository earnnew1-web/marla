import { getLineOaUrl, getSiteUrl } from "@/lib/line/env";
import { LINE_STATUS_COPY, type LineStatusKey } from "@/lib/line/status";

const BRAND = {
  ink: "#2B211C",
  paper: "#FAF7F2",
  accent: "#C45C4A",
  muted: "#8A7A70"
} as const;

type FlexOrder = {
  orderCode: string;
  totalPrice: number;
  customerPhone: string;
};

function logoUrl() {
  return `${getSiteUrl()}/tomato.png`;
}

function trackOrderUrl(order: FlexOrder) {
  const params = new URLSearchParams({
    code: order.orderCode,
    phone: order.customerPhone
  });
  return `${getSiteUrl()}/track-order?${params.toString()}`;
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

function footerButton(label: string, uri: string, style: "primary" | "secondary" = "primary") {
  return {
    type: "button" as const,
    style,
    color: style === "primary" ? BRAND.accent : undefined,
    height: "sm" as const,
    action: {
      type: "uri" as const,
      label,
      uri
    }
  };
}

export function buildOrderStatusFlexMessage(statusKey: LineStatusKey, order: FlexOrder) {
  const copy = LINE_STATUS_COPY[statusKey];

  return {
    type: "flex" as const,
    altText: `${copy.title} · ${order.orderCode} · ${copy.statusLabel}`,
    contents: {
      type: "bubble" as const,
      size: "mega" as const,
      hero: {
        type: "image" as const,
        url: logoUrl(),
        size: "full" as const,
        aspectRatio: "20:13" as const,
        aspectMode: "cover" as const,
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
            text: "Marla Film Lab",
            size: "xs" as const,
            color: BRAND.accent,
            weight: "bold" as const
          },
          {
            type: "text" as const,
            text: copy.title,
            weight: "bold" as const,
            size: "xl" as const,
            color: BRAND.ink,
            margin: "sm" as const,
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
          {
            type: "separator" as const,
            margin: "lg" as const,
            color: "#E8DFD6"
          },
          infoRow("Order code", order.orderCode),
          infoRow("Status", copy.statusLabel),
          infoRow("Total", `${order.totalPrice.toLocaleString("en-US")} THB`)
        ]
      },
      footer: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "sm" as const,
        backgroundColor: BRAND.paper,
        paddingAll: "16px" as const,
        contents: [
          footerButton("Track Order", trackOrderUrl(order), "primary"),
          footerButton("Contact Marla Film Lab", getLineOaUrl(), "secondary")
        ]
      }
    }
  };
}
