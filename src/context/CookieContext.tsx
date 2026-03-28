"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ConsentStatus = "accepted" | "declined" | "pending";

interface CookieContextType {
  consent: ConsentStatus;
  acceptCookies: () => void;
  declineCookies: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

const CONSENT_KEY = "agral_cookie_consent";

export function CookieProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentStatus>("pending");

  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (savedConsent === "accepted") {
      setConsent("accepted");
    } else if (savedConsent === "declined") {
      setConsent("declined");
    } else {
      setConsent("pending");
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setConsent("accepted");
  };

  const declineCookies = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setConsent("declined");
  };

  return (
    <CookieContext.Provider value={{ consent, acceptCookies, declineCookies }}>
      {children}
    </CookieContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error("useCookieConsent must be used within a CookieProvider");
  }
  return context;
}
