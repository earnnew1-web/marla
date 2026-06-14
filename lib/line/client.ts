import { getLineChannelAccessToken } from "@/lib/line/env";

type LineMessage = Record<string, unknown>;

export async function sendLinePushMessage(lineUserId: string, message: LineMessage) {
  const token = getLineChannelAccessToken();

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ to: lineUserId, messages: [message] })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE Messaging API failed (${response.status}): ${body}`);
  }
}

/** @deprecated Use sendLinePushMessage */
export async function pushLineMessage(to: string, messages: LineMessage[]) {
  if (messages.length !== 1) {
    throw new Error("pushLineMessage expects a single message; use sendLinePushMessage instead.");
  }
  await sendLinePushMessage(to, messages[0]);
}

export async function pushLineFlexMessage(to: string, message: LineMessage) {
  await sendLinePushMessage(to, message);
}
