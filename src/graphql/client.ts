"use client";

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

declare global {
  interface Window {
    __APOLLO_CLIENT__?: ApolloClient<unknown>;
  }
}

function normalizeGraphqlUrl(raw?: string) {
  if (!raw) return undefined;
  let url = raw.trim();
  const lower = url.toLowerCase();
  const hasGraphql = lower.endsWith("/graphql") || lower.endsWith("/graphql/");
  if (!hasGraphql) {
    url = url.replace(/\/+$/, "") + "/graphql/";
    if (typeof window !== "undefined") {
      console.warn(
        "[Apollo] NEXT_PUBLIC_API_URL did not include /graphql. Using:",
        url
      );
    }
  }
  return url;
}

const httpLink = createHttpLink({
  uri: normalizeGraphqlUrl(process.env.NEXT_PUBLIC_API_URL),
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors?.length) {
    for (const e of graphQLErrors) {
      // Keep this low-noise: useful during template setup.
      console.error("[GraphQL error]", e.message, e.extensions);
    }
  }
  if (networkError) {
    console.error("[Network error]", networkError);
  }
});

const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Product: { keyFields: ["id"] },
      ProductVariant: { keyFields: ["id"] },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-first", errorPolicy: "all" },
    query: { fetchPolicy: "cache-first", errorPolicy: "all" },
    mutate: { errorPolicy: "all" },
  },
});

if (typeof window !== "undefined") {
  window.__APOLLO_CLIENT__ = client;
}

export default client;

