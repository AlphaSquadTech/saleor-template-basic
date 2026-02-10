import { shopApi, type GraphQLCategory } from "@/lib/api/shop";
import { fetchMenuBySlug } from "@/graphql/queries/getMenuBySlug";

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

export const fetchCategories = async (): Promise<CategoryNode[]> => {
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

export const fetchMenuData = async (): Promise<MenuItem[]> => {
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
