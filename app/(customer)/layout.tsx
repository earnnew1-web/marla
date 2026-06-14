"use client";

import { CustomerLanguageProvider } from "@/lib/i18n/CustomerLanguageProvider";
import { LiffProvider } from "@/components/line/LiffProvider";

export default function CustomerRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerLanguageProvider>
      <LiffProvider>{children}</LiffProvider>
    </CustomerLanguageProvider>
  );
}
