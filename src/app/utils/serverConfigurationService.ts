import { cache } from "react";

export interface ClientSafeConfiguration {
  features: {
    dealer_locator: boolean;
    tiered_pricing: boolean;
    will_call: boolean;
  };
  dealer_locator: {
    token: string | null;
  };
  google: {
    recaptcha_site_key: string | null;
    recaptcha_locations: {
      login: boolean;
      signup: boolean;
      checkout: boolean;
    };
    tag_manager_container_id: string | null;
    maps_api_key: string | null;
    analytics_measurement_id: string | null;
    adsense_publisher_id: string | null;
    search_console_verification_content: string | null;
  };
}

function envBool(v: string | undefined, defaultValue: boolean) {
  if (v == null) return defaultValue;
  return v.toLowerCase() === "true";
}

/**
 * Server-side configuration for the template.
 *
 * This template intentionally avoids calling any external "configuration service".
 * Everything is configured via env vars.
 */
export const getClientSafeConfiguration = cache(
  async (): Promise<ClientSafeConfiguration> => {
    const dealerLocatorEnabled = envBool(
      process.env.NEXT_PUBLIC_DEALER_LOCATOR_ENABLED,
      true
    );

    // reCAPTCHA "locations" kept for compatibility with existing components.
    // Auth/checkout are removed in this template, so these default to false.
    const recaptchaLocations = {
      login: false,
      signup: false,
      checkout: false,
    };

    const searchConsoleContent =
      process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CONTENT || null;

    return {
      features: {
        dealer_locator: dealerLocatorEnabled,
        tiered_pricing: false,
        will_call: false,
      },
      dealer_locator: {
        token: process.env.NEXT_PUBLIC_DEALER_LOCATOR_TOKEN || null,
      },
      google: {
        recaptcha_site_key:
          process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY || null,
        recaptcha_locations: recaptchaLocations,
        tag_manager_container_id: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID || null,
        maps_api_key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null,
        analytics_measurement_id:
          process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null,
        adsense_publisher_id:
          process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID || null,
        search_console_verification_content: searchConsoleContent,
      },
    };
  }
);

