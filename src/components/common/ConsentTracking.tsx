"use client";

import { useCookieConsent } from "@/context/CookieContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export function ConsentTracking() {
  const { consent } = useCookieConsent();

  if (consent !== "accepted") {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
