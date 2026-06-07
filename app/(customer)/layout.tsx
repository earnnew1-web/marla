"use client";

import { CustomerLanguageProvider } from "@/lib/i18n/CustomerLanguageProvider";

export default function CustomerRouteLayout({ children }: { children: React.ReactNode }) {
  return <CustomerLanguageProvider>{children}</CustomerLanguageProvider>;
}
