"use client";

import { useEffect, useState } from "react";
import BounceCards from "@/components/BounceCards/BounceCards";

const heroImages = [
  "/images/hero-album/photo-1.jpg",
  "/images/hero-album/photo-2.jpg",
  "/images/hero-album/photo-3.jpg",
  "/images/hero-album/photo-4.jpg",
  "/images/hero-album/photo-5.jpg"
];

const desktopTransformStyles = [
  "rotate(6deg) translate(-220px)",
  "rotate(2deg) translate(-110px)",
  "rotate(-4deg)",
  "rotate(3deg) translate(110px)",
  "rotate(-6deg) translate(220px)"
];

const mobileTransformStyles = [
  "rotate(6deg) translate(-100px)",
  "rotate(2deg) translate(-50px)",
  "rotate(-4deg)",
  "rotate(3deg) translate(50px)",
  "rotate(-6deg) translate(100px)"
];

const narrowDesktopTransformStyles = [
  "rotate(6deg) translate(-180px)",
  "rotate(2deg) translate(-90px)",
  "rotate(-4deg)",
  "rotate(3deg) translate(90px)",
  "rotate(-6deg) translate(180px)"
];

type ViewportTier = "mobile" | "narrow" | "desktop";

function getViewportTier(width: number): ViewportTier {
  if (width <= 768) return "mobile";
  if (width <= 920) return "narrow";
  return "desktop";
}

export function HeroBounceCards() {
  const [tier, setTier] = useState<ViewportTier>("desktop");

  useEffect(() => {
    const update = () => setTier(getViewportTier(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isMobile = tier === "mobile";
  const transformStyles =
    tier === "mobile"
      ? mobileTransformStyles
      : tier === "narrow"
        ? narrowDesktopTransformStyles
        : desktopTransformStyles;

  const containerWidth = isMobile ? 360 : tier === "narrow" ? 700 : 760;
  const containerHeight = isMobile ? 280 : 360;
  const hoverPushOffset = isMobile ? 70 : tier === "narrow" ? 90 : 100;

  return (
    <div className="hero-gallery">
      <BounceCards
        className="marla-hero-bounce-cards"
        images={heroImages}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        animationDelay={0.6}
        animationStagger={0.08}
        easeType="elastic.out(1, 0.5)"
        transformStyles={transformStyles}
        hoverPushOffset={hoverPushOffset}
        enableHover
      />
    </div>
  );
}
