import type { NextConfig } from "next";

function uniq<T>(items: T[]) {
  return Array.from(new Set(items));
}

function toHost(urlOrHost?: string | null): string | null {
  if (!urlOrHost) return null;
  const raw = urlOrHost.trim();
  if (!raw) return null;

  // Allow passing a bare hostname (e.g. "cdn.example.com") or a URL.
  try {
    if (/^https?:\/\//i.test(raw)) return new URL(raw).hostname;
  } catch {
    // fall through
  }
  return raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}

function getRemoteImageHosts(): string[] {
  const envHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((h) => toHost(h))
    .filter((h): h is string => Boolean(h));

  // Common: allow images from the Saleor API hostname (media URLs).
  const saleorHost = toHost(process.env.NEXT_PUBLIC_API_URL);

  return uniq([saleorHost, ...envHosts].filter(Boolean) as string[]);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local dev media (optional)
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      // Explicit allowlist for template consumers
      ...getRemoteImageHosts().map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/**",
      })),
    ],
  },
};

export default nextConfig;

