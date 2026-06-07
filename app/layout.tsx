import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { fontVariables } from "@/app/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marla Film Lab",
  description: "Film developing, scanning, and delivery made simple."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
