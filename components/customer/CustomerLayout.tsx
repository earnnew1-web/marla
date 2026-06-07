"use client";

import { CustomerHeader } from "@/components/customer/CustomerHeader";

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <CustomerHeader />
      <div className="mx-auto max-w-4xl space-y-4 py-6">{children}</div>
    </main>
  );
}
