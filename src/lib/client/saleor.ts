export type GlobalSearchNodeEdge<T> = { node: T };

export type GlobalSearchProduct = {
  id: string;
  name: string;
  slug: string;
  updatedAt?: string;
  category?: { id: string; name: string } | null;
  thumbnail?: { url: string; alt?: string | null } | null;
};

export type GlobalSearchCategory = {
  id: string;
  name: string;
  slug: string;
  level?: number;
  parent?: { id: string } | null;
  backgroundImage?: { url: string; alt?: string | null } | null;
  products?: { totalCount?: number | null } | null;
};

export type GlobalSearchProductType = { id: string; name: string; slug: string };

export type SaleorProductNode = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: { id: string; name: string } | null;
  productType?: { id: string; name: string } | null;
  media?: Array<{ id: string; url: string; alt: string | null }>;
  pricing?: {
    onSale?: boolean | null;
    priceRange?: {
      start?: { gross?: { amount: number; currency: string } | null } | null;
      stop?: { gross?: { amount: number; currency: string } | null } | null;
    } | null;
  } | null;
};

export type SaleorProductsConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  edges: Array<{ cursor: string; node: SaleorProductNode }>;
};

export type GlobalSearchResponse = {
  products?: { edges: Array<GlobalSearchNodeEdge<GlobalSearchProduct>> } | null;
  categories?: { edges: Array<GlobalSearchNodeEdge<GlobalSearchCategory>> } | null;
  collections?: { edges: Array<GlobalSearchNodeEdge<unknown>> } | null;
  productTypes?: { edges: Array<GlobalSearchNodeEdge<GlobalSearchProductType>> } | null;
};

export async function saleorGlobalSearch(params: {
  q: string;
  channel?: string;
  includeProducts?: boolean;
  includeCategories?: boolean;
  includeCollections?: boolean;
  includeProductTypes?: boolean;
}): Promise<GlobalSearchResponse> {
  const sp = new URLSearchParams();
  sp.set("q", params.q);
  if (params.channel) sp.set("channel", params.channel);
  if (params.includeProducts !== undefined)
    sp.set("includeProducts", String(params.includeProducts));
  if (params.includeCategories !== undefined)
    sp.set("includeCategories", String(params.includeCategories));
  if (params.includeCollections !== undefined)
    sp.set("includeCollections", String(params.includeCollections));
  if (params.includeProductTypes !== undefined)
    sp.set("includeProductTypes", String(params.includeProductTypes));

  const res = await fetch(`/api/saleor/global-search?${sp.toString()}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Saleor global search failed (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as GlobalSearchResponse;
}

export async function saleorFetchProducts(params: {
  kind: "byCategory" | "byProductType" | "byCategoriesAndProductTypes";
  variables: Record<string, unknown>;
}): Promise<{ products: SaleorProductsConnection }> {
  const res = await fetch(`/api/saleor/products`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Saleor products failed (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as { products: SaleorProductsConnection };
}
