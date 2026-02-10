/**
 * Cached fetch wrapper for GraphQL queries
 * Uses Next.js fetch cache for server-side and Apollo cache for client-side
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/?$/, '/graphql/') || '';

export interface CachedFetchOptions {
  revalidate?: number; // Seconds to cache (default: 300 = 5 minutes)
  tags?: string[]; // Cache tags for on-demand revalidation
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, unknown>;
  }>;
}

export async function cachedGraphQLFetch<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
  options: CachedFetchOptions = {}
): Promise<T | null> {
  const { revalidate = 300, tags = [] } = options;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      next: {
        revalidate,
        tags,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = (await response.json()) as GraphQLResponse<T>;

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return null;
    }

    return result.data ?? null;
  } catch (error) {
    console.error('Error in cachedGraphQLFetch:', error);
    return null;
  }
}
