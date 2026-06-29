"use client";

import Link from "next/link";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { HeroBounceCards } from "@/components/customer/HeroBounceCards";
import { StartOrderCta } from "@/components/customer/StartOrderCta";
import { Button } from "@/components/ui/button";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { heroHeadline, heroSubtext } from "@/lib/typography";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { t } = useCustomerLanguage();

  return (
    <main className="flex min-h-screen flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <CustomerHeader />

      <section className="mx-auto flex w-full flex-1 flex-col items-center justify-center gap-6 py-4 sm:min-h-[calc(100vh-7.5rem)] sm:gap-8 sm:py-6">
        <div className="flex w-full flex-col items-center">
          <img
            src="/images/home/hero-motion.gif"
            alt="Marla Film Lab animated process illustration"
            width={160}
            height={98}
            className="h-auto w-[110px] shrink-0 sm:w-[160px]"
            decoding="async"
          />

          <div className="hero-gallery mt-6 w-full sm:mt-8">
            <HeroBounceCards />
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col items-center gap-6 sm:gap-8">
          <div className="flex flex-col items-center gap-3">
            <h1 className={cn(heroHeadline, "leading-tight")}>{t.home.headline}</h1>
            <p className={heroSubtext}>{t.home.subtext}</p>
          </div>
          <div className="flex w-full flex-col gap-4">
            <StartOrderCta />
            <Button asChild variant="outline" size="lg" className="min-h-16 w-full text-base">
              <Link href="/track-order">{t.home.trackOrder}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
