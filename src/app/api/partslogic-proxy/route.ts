import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const PARTSLOGIC_URL = process.env.NEXT_PUBLIC_PARTSLOGIC_URL || "";

function isSafePath(path: string) {
  // Only allow absolute paths, no protocol/host injection.
  if (!path.startsWith("/")) return false;
  if (path.includes("://")) return false;
  if (path.includes("..")) return false;
  return true;
}

export async function GET(req: NextRequest) {
  let target = "unknown";
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");
    if (!path) {
      return NextResponse.json(
        { message: "Missing 'path' query param" },
        { status: 400 }
      );
    }
    if (!PARTSLOGIC_URL) {
      return NextResponse.json(
        { message: "Missing NEXT_PUBLIC_PARTSLOGIC_URL" },
        { status: 500 }
      );
    }
    if (!isSafePath(path)) {
      return NextResponse.json({ message: "Invalid path" }, { status: 400 });
    }

    target = `${PARTSLOGIC_URL}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const upstream = await fetch(target, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    const text = await upstream.text();

    if (!upstream.ok) {
      console.error(
        `[PartsLogic Proxy] Upstream error: ${upstream.status} - ${text}`
      );
    }

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Proxy error";
    console.error(`[PartsLogic Proxy] Error:`, e);
    return NextResponse.json({ message: msg, target }, { status: 502 });
  }
}

