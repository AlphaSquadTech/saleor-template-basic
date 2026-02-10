"use client";

import { useEffect } from "react";
import { useAppConfiguration } from "../providers/ServerAppConfigurationProvider";

export default function AnalyticsScripts() {
  const { getGoogleTagManagerConfig, getGoogleAdSenseConfig } = useAppConfiguration();
  
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const gtmConfig = getGoogleTagManagerConfig();
    const adSenseConfig = getGoogleAdSenseConfig();

    const GTM_ID = gtmConfig?.container_id;
    const ADSENSE_CLIENT_ID = adSenseConfig?.publisher_id;

    // Load Google Tag Manager
    if (GTM_ID) {
      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        "gtm.start": new Date().getTime(),
        event: "gtm.js",
      });

      // Load GTM script
      const gtmScript = document.createElement("script");
      gtmScript.async = true;
      gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
      document.head.appendChild(gtmScript);
    }

    // Load Google AdSense
    if (ADSENSE_CLIENT_ID) {
      const adSenseScript = document.createElement("script");
      adSenseScript.async = true;
      adSenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      adSenseScript.crossOrigin = "anonymous";
      document.head.appendChild(adSenseScript);
    }

  }, [getGoogleTagManagerConfig, getGoogleAdSenseConfig]);

  return null;
}
