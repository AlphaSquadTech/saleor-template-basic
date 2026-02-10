import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import {
  fetchConfigurationDirect,
  isFeatureActive,
} from "@/app/utils/configurationService";
import redirects from "../redirects.json" with { type: "json" };

type JwtPayload = { exp?: number };

const AUTH_ROUTES = [
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
];

const PROTECTED_PREFIXES = ["/account", "/orders", "/settings"];

const ECOMMERCE_ROUTES = [
  "/cart",
  "/checkout",
  "/order-confirmation",
  "/account",
];

const FEATURE_ROUTES = {
  "/locator": "dealer_locator",
} as const;

const slugTo3FitmentRedirect: Record<string, string> = {};

// Preprocess redirects
Object.entries(redirects).forEach(([from, to]) => {
  if (!from.startsWith("/ag-")) return;
  const slug = from
    .replace(/^\/ag-[\d.]+-/, "")
    .replace(/\.html$/, "")
    .toLowerCase();
  slugTo3FitmentRedirect[slug] = to;
});

// Normalize slug for comparison
function normalizeFitmentSlug(slug: string) {
  return slug
    .toLowerCase()
    .replace(/\.html$/, "")
    .replace(/(\d)[-]?(\d)l(\.\d+)?/g, (_, d1, d2) => `${d1}${d2}l`) // 2-0l → 2.0l
    .replace(/\b\d+-?(cyl|cylinder|cylinders)?\b/g, "") // remove cylinders
    .replace(/\b(v|l)\d+\b/g, "")
    .replace(/[^\w-]+/g, "")
    .split("-")
    .filter(Boolean)
    .sort()
    .join("-");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const exactRedirect = redirects[pathname as keyof typeof redirects];
  if (exactRedirect) {
    return NextResponse.redirect(new URL(exactRedirect, req.url), 308);
  }

  if (pathname.startsWith("/ag-")) {
    const idsMatch = pathname.match(/^\/ag-([\d.]+)-(.+)\.html$/);
    const ids = idsMatch?.[1]?.split(".").filter(id => /^\d+$/.test(id)) || [];
    const textPart = idsMatch?.[2] || "";

    // Handle incomplete searches - search by text
    if (ids.length === 1 && textPart) {
      const searchText = textPart.toLowerCase().replace(/--+/g, "-");
      for (const [from, to] of Object.entries(redirects)) {
        const canonicalText = from.match(/^\/ag-[\d.]+-(.+)\.html$/)?.[1]?.toLowerCase() || "";
        if (canonicalText.includes(searchText)) {
          const parts = canonicalText.split("-").filter(p => p.length > 1);
          const searchParts = searchText.split("-").filter(p => p.length > 1);
          const matchIndex = parts.findIndex(p => 
            searchParts.some(sp => p.includes(sp) || sp.includes(p))
          );
          if (matchIndex >= 0) {
            const pairs = to.match(/fitment_pairs=([^&]+)/)?.[1] || "";
            const pairArray = pairs.split(",");
            const targetPair = pairArray[matchIndex];
            return NextResponse.redirect(new URL(`/search?fitment_pairs=${targetPair}`, req.url), 308);
          }
        }
      }
    }

    if (ids.length === 2 && textPart) {
      const searchText = textPart.toLowerCase().replace(/--+/g, "-");
      for (const [from, to] of Object.entries(redirects)) {
        const canonicalText = from.match(/^\/ag-[\d.]+-(.+)\.html$/)?.[1]?.toLowerCase() || "";
        if (canonicalText.includes(searchText)) {
          const parts = canonicalText.split("-").filter(p => p.length > 1);
          const searchParts = searchText.split("-").filter(p => p.length > 1);
          const matchIndex = parts.findIndex(p => 
            searchParts.some(sp => p.includes(sp) || sp.includes(p))
          );
          if (matchIndex >= 0) {
            const pairs = to.match(/fitment_pairs=([^&]+)/)?.[1] || "";
            const pairArray = pairs.split(",");
            const targetPairs = pairArray.slice(matchIndex, matchIndex + 2).join(",");
            return NextResponse.redirect(new URL(`/search?fitment_pairs=${targetPairs}`, req.url), 308);
          }
        }
      }
    }

    // Handle complete searches (3+ IDs)
    if (ids.length >= 3) {
      const fullSlug = pathname
        .replace(/^\/ag-/, "")
        .replace(/\.html$/, "")
        .replace(/^[\d.]+-/, "");
      
      const incomingYear = fullSlug.match(/^(\d{4})-/)?.[1];
      const incomingVehicle = normalizeFitmentSlug(fullSlug.replace(/^\d{4}-/, ""));

      for (const [canonicalSlug, destination] of Object.entries(slugTo3FitmentRedirect)) {
        const canonicalYear = canonicalSlug.match(/^(\d{4})-/)?.[1];
        const canonicalVehicle = normalizeFitmentSlug(
          canonicalSlug.replace(/^\d{4}-/, "")
        );

        if (incomingYear === canonicalYear && canonicalVehicle === incomingVehicle) {
          return NextResponse.redirect(new URL(destination, req.url), 308);
        }
      }
    }

    return NextResponse.redirect(new URL("/search", req.url), 308);
  }

  const normalizedPath =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  const blockCheckout = process.env.NEXT_PUBLIC_BLOCK_CHECKOUT === "true";
  if (blockCheckout) {
    const isEcommerceRoute = ECOMMERCE_ROUTES.some(
      (route) =>
        normalizedPath === route ||
        normalizedPath.startsWith(route + "/"),
    );
    if (isEcommerceRoute) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  const featureName =
    FEATURE_ROUTES[normalizedPath as keyof typeof FEATURE_ROUTES];
  if (featureName) {
    try {
      const configuration = await fetchConfigurationDirect();
      const isActive = isFeatureActive(configuration, featureName);
      if (!isActive) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch {
      // fail open
    }
  }

  const tokenCookie = req.cookies.get("token");
  const refreshCookie = req.cookies.get("refreshToken");
  let isTokenValid = false;
  if (tokenCookie?.value) {
    try {
      const { exp } = jwtDecode<JwtPayload>(tokenCookie.value);
      isTokenValid = !!exp && exp * 1000 > Date.now();
    } catch {
      isTokenValid = false;
    }
  }

  const isLoggedIn = !!tokenCookie && isTokenValid;
  const isAuthRoute = AUTH_ROUTES.some(
    (route) =>
      normalizedPath === route ||
      normalizedPath.startsWith(route + "/"),
  );
  const isProtectedRoute =
    PROTECTED_PREFIXES.some(
      (prefix) =>
        normalizedPath === prefix ||
        normalizedPath.startsWith(prefix + "/"),
    ) && !isAuthRoute;

  const isProd = process.env.NODE_ENV === "production";

  const debugHeaders: Record<string, string> = {
    "x-pathname": normalizedPath,
    "x-has-token": tokenCookie ? "1" : "0",
    "x-has-refresh": refreshCookie ? "1" : "0",
    "x-is-logged-in": isLoggedIn ? "1" : "0",
    "x-is-auth-route": isAuthRoute ? "1" : "0",
    "x-is-protected-route": isProtectedRoute ? "1" : "0",
  };

  if (tokenCookie && !isTokenValid) {
    const loginUrl = new URL("/api/auth/clear-cookies", req.url);
    loginUrl.searchParams.set("redirect", "/account/login");
    loginUrl.searchParams.set("reason", "token-expired");
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL("/account/login", req.url);
    loginUrl.searchParams.set("next", normalizedPath);
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  if (!isProd) {
    res.headers.set("x-middleware-hit", "1");
    Object.entries(debugHeaders).forEach(([k, v]) =>
      res.headers.set(k, v),
    );
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|manifest.webmanifest|sitemap.xml|robots.txt).*)",
  ],
};
