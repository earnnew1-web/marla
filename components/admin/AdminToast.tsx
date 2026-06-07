"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function AdminToast({
  message,
  tone = "success",
  onClose
}: {
  message: string;
  tone?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    if (tone === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }

    const timer = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(timer);
  }, [message, tone, onClose]);

  return null;
}
