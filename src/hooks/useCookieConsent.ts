import { useState, useEffect } from 'react';

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  consentDate: string;
  consentVersion: string;
}

const CONSENT_KEY = 'checomex_cookie_consent';
const CURRENT_VERSION = '1.0';
const CONSENT_EXPIRY_DAYS = 365;

function isConsentValid(consent: CookieConsent): boolean {
  if (consent.consentVersion !== CURRENT_VERSION) return false;
  const consentDate = new Date(consent.consentDate);
  const now = new Date();
  const diffDays = (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < CONSENT_EXPIRY_DAYS;
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed: CookieConsent = JSON.parse(stored);
        if (isConsentValid(parsed)) {
          setConsent(parsed);
          setShowBanner(false);
          return;
        }
      } catch {
        // Invalid stored data — fall through to show banner
      }
    }
    setShowBanner(true);
  }, []);

  const saveConsent = (newConsent: Omit<CookieConsent, 'necessary' | 'consentDate' | 'consentVersion'>) => {
    const full: CookieConsent = {
      necessary: true,
      ...newConsent,
      consentDate: new Date().toISOString(),
      consentVersion: CURRENT_VERSION,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
    setConsent(full);
    setShowBanner(false);
  };

  const acceptAll = () => saveConsent({ analytics: true, functional: true, marketing: true });
  const acceptEssential = () => saveConsent({ analytics: false, functional: false, marketing: false });
  const acceptCustom = (prefs: { analytics: boolean; functional: boolean; marketing: boolean }) =>
    saveConsent(prefs);

  return { consent, showBanner, acceptAll, acceptEssential, acceptCustom };
}
