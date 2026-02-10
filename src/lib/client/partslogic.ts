export type PLFacetItem = {
  id: string;
  value: string;
  count: number;
  media?: string | null;
};

export type PLSearchProduct = {
  id: string;
  name: string;
  slug: string;
  price_min?: number | null;
  price_max?: number | null;
  primary_image?: string | null;
  thumbnail?: { url: string; alt?: string | null } | null;
  category_name?: string | null;
  category_id?: string | null;
  category?: { id: string; name: string } | null;
  collection_names?: string[] | null;
  skus?: string[] | null;
  [k: string]: unknown;
};

export type PLSearchProductsResponse = {
  products: PLSearchProduct[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
  facets: {
    categories: PLFacetItem[];
    brands: PLFacetItem[];
    product_types?: PLFacetItem[];
    price_ranges?: Array<{ min: number; max: number; count: number }> | null;
    years?: Array<{ value: string; count: number }>;
    makes?: Array<{ value: string; count: number }>;
    models?: Array<{ value: string; count: number }>;
  };
  [k: string]: unknown;
};

export type FitmentRootType = { id: number; name: string; children?: FitmentRootType[] };
export type FitmentValue = { id: number; value: string };

export type PLCatalogItem = { id: string; image: string; name: string; slug: string };

async function proxyGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api/partslogic-proxy?path=${encodeURIComponent(path)}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PartsLogic proxy failed (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

function qp(params: Record<string, string | number | boolean | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  return sp.toString();
}

export const partsLogicClient = {
  async searchProducts(params: {
    q?: string;
    page?: number;
    per_page?: number;
    fitment_pairs?: string;
    category_slug?: string;
    brand_slug?: string;
  }): Promise<PLSearchProductsResponse> {
    const query = qp({
      q: params.q,
      page: params.page ?? 1,
      per_page: params.per_page ?? 20,
      fitment_pairs: params.fitment_pairs,
      category_slug: params.category_slug,
      brand_slug: params.brand_slug,
    });
    return proxyGet<PLSearchProductsResponse>(`/api/search/products?${query}`);
  },

  async getCategories(): Promise<{ categories: PLCatalogItem[] }> {
    return proxyGet(`/api/categories?page=1&per_page=100`);
  },

  async getBrands(): Promise<{ brands: PLCatalogItem[] }> {
    return proxyGet(`/api/brands?page=1&per_page=100`);
  },

  async getRootTypes(): Promise<{ success: boolean; data: FitmentRootType[]; message: string }> {
    return proxyGet(`/api/fitment-search/root-types`);
  },

  async getFitmentValues(typeId: number, selectedPairs?: string): Promise<{ success: boolean; data: FitmentValue[] | FitmentValue; message: string }> {
    const suffix = selectedPairs ? `${typeId}?selected_pairs=${encodeURIComponent(selectedPairs)}` : String(typeId);
    return proxyGet(`/api/fitment-search/values/${suffix}`);
  },

  async getFitmentChildTypes(query: string): Promise<{ success: boolean; data: FitmentValue[]; message: string }> {
    return proxyGet(`/api/fitment-search/child-types/${encodeURIComponent(query)}`);
  },

  async getFitmentGroups(productId: string): Promise<{ data: unknown }> {
    return proxyGet(`/api/products/${encodeURIComponent(productId)}/fitment-groups`);
  },

  async getMakes(yearId: number | string): Promise<{ success: boolean; data: Array<{ id: number; value: string }>; message: string }> {
    return proxyGet(`/api/search/fitments/makes?year_id=${encodeURIComponent(String(yearId))}`);
  },

  async getModels(yearId: number | string, makeId: number | string): Promise<{ success: boolean; data: Array<{ id: number; value: string }>; message: string }> {
    return proxyGet(`/api/search/fitments/models?year_id=${encodeURIComponent(String(yearId))}&make_id=${encodeURIComponent(String(makeId))}`);
  },
};
