import { gql } from "@apollo/client";

/**
 * Query to search for categories with metadata.
 * This fetches categories with their metadata so we can search for old slugs client-side.
 * Uses pagination to handle large category catalogs.
 */
export const FIND_CATEGORY_BY_OLD_SLUG = gql`
  query FindCategoryByOldSlug($first: Int = 100, $after: String) {
    categories(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          slug
          name
          metadata {
            key
            value
          }
        }
      }
    }
  }
`;

// --- Types ---

export interface CategoryMetadata {
  key: string;
  value: string;
}

export interface FindCategoryByOldSlugData {
  categories: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    edges: Array<{
      node: {
        id: string;
        slug: string;
        name: string;
        metadata: CategoryMetadata[];
      };
    }>;
  };
}

export interface FindCategoryByOldSlugVars {
  first?: number;
  after?: string | null;
}
