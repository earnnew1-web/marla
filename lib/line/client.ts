import { getLineChannelAccessToken } from "@/lib/line/env";

type LineMessage = Record<string, unknown>;

export async function pushLineMessage(to: string, messages: LineMessage[]) {
  const token = getLineChannelAccessToken();

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ to, messages })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE Messaging API failed (${response.status}): ${body}`);
  }
}

export async function pushLineFlexMessage(to: string, message: LineMessage) {
  await pushLineMessage(to, [message]);
}
