export function getLiffId() {
  return process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
}

export function hasLiffId() {
  return Boolean(getLiffId());
}

export function getLineChannelAccessToken() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured.");
  }
  return token;
}

export function getLineChannelSecret() {
  return process.env.LINE_CHANNEL_SECRET?.trim() ?? "";
}

export function hasLineMessagingConfigured() {
  return Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim());
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://marlafilmlab.com";
}

export function getLineOaUrl() {
  const configured = process.env.NEXT_PUBLIC_LINE_OA_URL?.trim();
  if (configured) return configured;
  const oaId = process.env.NEXT_PUBLIC_LINE_OA_ID?.trim();
  if (oaId) return `https://line.me/R/ti/p/@${oaId.replace(/^@/, "")}`;
  return "https://line.me/R/ti/p/@marlafilmlab";
}
