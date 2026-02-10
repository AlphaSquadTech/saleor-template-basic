import { shopApi } from "@/lib/api/shop";
import type { GraphQLCategory } from "@/lib/api/shopTypes";
import { fetchMenuBySlug } from "@/graphql/queries/getMenuBySlug";
import { unstable_cache } from "next/cache";

export type CategoryNode = {
  id: string;
  name: string;
  slug?: string;
  children?: CategoryNode[];
};

export type MenuItem = {
  id: string;
  name: string;
  url: string;
  level: number;
  metadata?: Array<{
    key: string;
    value: string;
  }>;
  children?: MenuItem[];
};

const fetchCategoriesUncached = async (): Promise<CategoryNode[]> => {
  try {
    // Fetch categories from GraphQL API (same as shop page)
    const channel = "default-channel";
    const categoriesResponse = await shopApi.getGraphQLCategories({ channel });
    
    // Transform GraphQL categories to match expected format
    const buildHierarchy = (categories: GraphQLCategory[], parentId: string | null = null): CategoryNode[] => {
      return categories
        .filter(cat => {
          if (parentId === null) {
            return !cat.parent; // Root categories
          }
          return cat.parent?.id === parentId;
        })
        .map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug, // Use Saleor's slug field
          children: buildHierarchy(categories, category.id)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    };

    const categoryNodes = categoriesResponse.categories.edges.map(edge => edge.node);
    return buildHierarchy(categoryNodes);
  } catch (error) {
    console.error('Failed to fetch categories from GraphQL API:', error);
    return [];
  }
};

const fetchMenuDataUncached = async (): Promise<MenuItem[]> => {
  try {
    const menuData = await fetchMenuBySlug("navbar");
    if (
      menuData &&
      typeof menuData === "object" &&
      "items" in menuData &&
      Array.isArray(menuData.items)
    ) {
      return menuData.items as MenuItem[];
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch menu data:', error);
    return [];
  }
};

// Cache across requests (and during prerender/build) so the main nav can be
// served as static HTML without refetching on every request.
export const fetchCategories = unstable_cache(
  fetchCategoriesUncached,
  ["navbar:categories:v1"],
  { revalidate: 60 * 60 } // 1h
);

export const fetchMenuData = unstable_cache(
  fetchMenuDataUncached,
  ["navbar:menu:v1"],
  { revalidate: 60 * 60 } // 1h
);
