import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

function normalizeGraphqlUrl(input: string) {
  let url = input.trim();
  const lower = url.toLowerCase();
  const hasGraphql = lower.endsWith("/graphql") || lower.endsWith("/graphql/");
  if (!hasGraphql) {
    url = url.replace(/\/+$/, "") + "/graphql/";
  }
  return url;
}

function fetchWithTimeout(
  uri: RequestInfo | URL,
  options?: RequestInit & { next?: { revalidate?: number } }
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000);
  return fetch(uri, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(t)
  );
}

const createApolloServerClient = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const apiUrl = normalizeGraphqlUrl(raw);
  const httpLink = createHttpLink({
    uri: apiUrl,
    fetch: (uri, options) => {
      return fetchWithTimeout(uri, {
        ...options,
        next: { revalidate: 300 }, // Cache for 5 minutes
      });
    },
  });

  return new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    ssrMode: true,
    defaultOptions: {
      query: {
        errorPolicy: "ignore",
        fetchPolicy: "cache-first",
      },
    },
  });
};

export default createApolloServerClient;
