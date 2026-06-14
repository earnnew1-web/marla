"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/customer/LanguageSwitcher";

export function CustomerHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between py-2 sm:py-3">
      <Link href="/" className="inline-flex shrink-0" aria-label="Marla Film Lab home">
        <img
          src="/tomato.png"
          alt="Marla Film Lab"
          className="h-auto w-[96px] object-contain sm:w-[128px] md:w-[148px]"
        />
      </Link>
      <LanguageSwitcher />
    </header>
  );
}
