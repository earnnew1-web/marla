"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/components/line/LiffProvider";

function useShowLineDebug() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShow(process.env.NODE_ENV === "development" || params.get("debugLine") === "1");
  }, []);

  return show;
}

export function LineDebugPanel() {
  const show = useShowLineDebug();
  const { ready, inLine, profile, liffIdConfigured } = useLiff();

  if (!show) return null;

  const lineUserIdPreview = profile?.userId ? profile.userId.slice(0, 6) : "(empty)";

  return (
    <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2.5 text-xs font-mono text-amber-950">
      <p>LIFF ID exists: {liffIdConfigured ? "true" : "false"}</p>
      <p>Is in LINE client: {inLine ? "true" : "false"}</p>
      <p>LIFF initialized: {ready ? "true" : "false"}</p>
      <p>LINE profile loaded: {profile?.userId ? "true" : "false"}</p>
      <p>line_user_id: {lineUserIdPreview}</p>
      <p>line_connected: {profile?.userId ? "true" : "false"}</p>
    </div>
  );
}
