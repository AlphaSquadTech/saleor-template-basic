import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type Kind =
  | "byCategory"
  | "byProductType"
  | "byCategoriesAndProductTypes";

const QUERY_BY_CATEGORY = `
  query ProductsByCategory(
    $categoryIds: [ID!]
    $channel: String!
    $first: Int
    $after: String
    $search: String
  ) {
    products(
      filter: { categories: $categoryIds, search: $search }
      channel: $channel
      first: $first
      after: $after
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          slug
          description
          category {
            id
            name
          }
          productType {
            id
            name
          }
          media {
            id
            url
            alt
          }
          pricing {
            priceRange {
              start {
                gross {
                  amount
                  currency
                }
              }
              stop {
                gross {
                  amount
                  currency
                }
              }
            }
          }
        }
      }
    }
  }
`;

const QUERY_BY_PRODUCT_TYPE = `
  query ProductsByProductType(
    $productTypeIds: [ID!]
    $channel: String!
    $first: Int
    $after: String
    $search: String
  ) {
    products(
      filter: { productTypes: $productTypeIds, search: $search }
      channel: $channel
      first: $first
      after: $after
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          slug
          description
          category {
            id
            name
          }
          productType {
            id
            name
          }
          media {
            id
            url
            alt
          }
          pricing {
            priceRange {
              start {
                gross {
                  amount
                  currency
                }
              }
              stop {
                gross {
                  amount
                  currency
                }
              }
            }
          }
        }
      }
    }
  }
`;

const QUERY_BY_CATS_AND_TYPES = `
  query ProductsByCatsAndTypes(
    $categoryIds: [ID!]
    $productTypeIds: [ID!]
    $channel: String!
    $first: Int
    $after: String
  ) {
    products(
      filter: { categories: $categoryIds, productTypes: $productTypeIds }
      channel: $channel
      first: $first
      after: $after
      sortBy: { field: DATE, direction: ASC }
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          slug
          description
          category {
            id
            name
          }
          productType {
            id
            name
          }
          media {
            id
            url
            alt
          }
          pricing {
            priceRange {
              start {
                gross {
                  amount
                  currency
                }
              }
              stop {
                gross {
                  amount
                  currency
                }
              }
            }
          }
        }
      }
    }
  }
`;

function pickQuery(kind: Kind) {
  switch (kind) {
    case "byCategory":
      return QUERY_BY_CATEGORY;
    case "byProductType":
      return QUERY_BY_PRODUCT_TYPE;
    case "byCategoriesAndProductTypes":
      return QUERY_BY_CATS_AND_TYPES;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export async function POST(req: NextRequest) {
  try {
    if (!SALEOR_API_URL) {
      return NextResponse.json(
        { message: "Missing NEXT_PUBLIC_API_URL" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as
      | {
          kind: Kind;
          variables: Record<string, unknown>;
        }
      | null;

    if (!body?.kind || !body?.variables) {
      return NextResponse.json(
        { message: "Missing kind/variables" },
        { status: 400 }
      );
    }

    const query = pickQuery(body.kind);

    const upstream = await fetch(SALEOR_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: body.variables }),
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
    return NextResponse.json(json["data"] ?? null);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Products error";
    return NextResponse.json({ message: msg }, { status: 502 });
  }
}
