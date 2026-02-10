import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const GLOBAL_SEARCH_QUERY = `
  query GlobalSearchStorefront(
    $query: String!
    $channel: String!
    $includeProducts: Boolean!
    $includeCategories: Boolean!
    $includeCollections: Boolean!
    $includeProductTypes: Boolean!
  ) {
    globalSearch(
      query: $query
      channel: $channel
      includeProducts: $includeProducts
      includeCategories: $includeCategories
      includeCollections: $includeCollections
      includeProductTypes: $includeProductTypes
    ) {
      products @include(if: $includeProducts) {
        edges {
          node {
            id
            name
            slug
            updatedAt
            category {
              id
              name
            }
            thumbnail {
              url
              alt
            }
          }
        }
      }
      categories @include(if: $includeCategories) {
        edges {
          node {
            id
            name
            slug
            level
            parent {
              id
            }
            backgroundImage {
              url
              alt
            }
            products {
              totalCount
            }
          }
        }
      }
      collections @include(if: $includeCollections) {
        edges {
          node {
            id
            name
            slug
            backgroundImage {
              url
              alt
            }
            products {
              totalCount
            }
          }
        }
      }
      productTypes @include(if: $includeProductTypes) {
        edges {
          node {
            id
            name
            slug
          }
        }
      }
    }
  }
`;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export async function GET(req: NextRequest) {
  try {
    if (!SALEOR_API_URL) {
      return NextResponse.json(
        { message: "Missing NEXT_PUBLIC_API_URL" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const channel =
      (searchParams.get("channel") || "").trim() ||
      process.env.NEXT_PUBLIC_SALEOR_CHANNEL ||
      "default-channel";

    if (!q) {
      return NextResponse.json({ message: "Missing 'q'" }, { status: 400 });
    }

    const includeProducts = (searchParams.get("includeProducts") || "true") === "true";
    const includeCategories = (searchParams.get("includeCategories") || "true") === "true";
    const includeCollections = (searchParams.get("includeCollections") || "false") === "true";
    const includeProductTypes = (searchParams.get("includeProductTypes") || "true") === "true";

    const upstream = await fetch(SALEOR_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GLOBAL_SEARCH_QUERY,
        variables: {
          query: q,
          channel,
          includeProducts,
          includeCategories,
          includeCollections,
          includeProductTypes,
        },
      }),
      cache: "no-store",
    });

    const json = (await upstream.json().catch(() => null)) as unknown;
    if (!upstream.ok) {
      return NextResponse.json(
        { message: "Saleor request failed", status: upstream.status, json },
        { status: 502 }
      );
    }

    if (
      isRecord(json) &&
      Array.isArray(json["errors"]) &&
      (json["errors"] as unknown[]).length
    ) {
      return NextResponse.json(
        { message: "Saleor GraphQL error", errors: json["errors"] },
        { status: 502 }
      );
    }

    if (!isRecord(json)) return NextResponse.json(null);
    const data = json["data"];
    if (!isRecord(data)) return NextResponse.json(null);
    return NextResponse.json((data as Record<string, unknown>)["globalSearch"] ?? null);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Global search error";
    return NextResponse.json({ message: msg }, { status: 502 });
  }
}
