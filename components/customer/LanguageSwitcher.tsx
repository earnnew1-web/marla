"use client";

import { Button } from "@/components/ui/button";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { language, setLanguage } = useCustomerLanguage();

  return (
    <div
      className="inline-flex rounded-lg border border-border bg-card p-1"
      role="group"
      aria-label="Language switcher"
    >
      <Button
        type="button"
        variant={language === "th" ? "default" : "ghost"}
        size="sm"
        className={cn("min-w-11 px-3 text-xs font-bold", language !== "th" && "text-muted-foreground")}
        onClick={() => setLanguage("th")}
      >
        TH
      </Button>
      <Button
        type="button"
        variant={language === "en" ? "default" : "ghost"}
        size="sm"
        className={cn("min-w-11 px-3 text-xs font-bold", language !== "en" && "text-muted-foreground")}
        onClick={() => setLanguage("en")}
      >
        EN
      </Button>
    </div>
  );
}
