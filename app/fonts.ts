import localFont from "next/font/local";

/** English / numbers — Google Sans (variable 400–800). */
export const googleSans = localFont({
  src: "./fonts/GoogleSans-Variable.ttf",
  variable: "--font-sans",
  weight: "400 800",
  display: "swap",
  fallback: ["Helvetica Neue", "sans-serif"]
});

/** Thai — IBM Plex Sans Thai Loopless (local TTF). */
export const ibmPlexSansThai = localFont({
  src: [
    {
      path: "./fonts/IBMPlexSansThai-Regular.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "./fonts/IBMPlexSansThai-Medium.ttf",
      weight: "500",
      style: "normal"
    },
    {
      path: "./fonts/IBMPlexSansThai-Medium.ttf",
      weight: "600",
      style: "normal"
    },
    {
      path: "./fonts/IBMPlexSansThai-Bold.ttf",
      weight: "700",
      style: "normal"
    }
  ],
  variable: "--font-thai",
  display: "swap",
  fallback: ["Helvetica Neue", "sans-serif"]
});

export const fontVariables = `${googleSans.variable} ${ibmPlexSansThai.variable}`;
