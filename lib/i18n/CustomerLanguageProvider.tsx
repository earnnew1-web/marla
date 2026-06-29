"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  customerCopy,
  getStoredLanguage,
  setStoredLanguage,
  type CustomerCopy,
  type CustomerLanguage
} from "@/lib/i18n/customer";

type CustomerLanguageContextValue = {
  language: CustomerLanguage;
  setLanguage: (language: CustomerLanguage) => void;
  t: CustomerCopy;
};

const CustomerLanguageContext = createContext<CustomerLanguageContextValue | null>(null);

export function CustomerLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<CustomerLanguage>(() => getStoredLanguage());

  useEffect(() => {
    setLanguageState(getStoredLanguage());
  }, []);

  const setLanguage = (next: CustomerLanguage) => {
    setStoredLanguage(next);
    setLanguageState(next);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: customerCopy[language]
    }),
    [language]
  );

  return <CustomerLanguageContext.Provider value={value}>{children}</CustomerLanguageContext.Provider>;
}

export function useCustomerLanguage() {
  const context = useContext(CustomerLanguageContext);
  if (!context) {
    throw new Error("useCustomerLanguage must be used within CustomerLanguageProvider");
  }
  return context;
}
