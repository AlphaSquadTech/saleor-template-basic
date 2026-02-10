import { gql } from "@apollo/client";

// GraphQL Query
export const GET_ONLINE_DEALERS = gql`
  query OnlineDealers {
    pages(first: 10, filter: { slugs: "online-dealers" }) {
      edges {
        node {
          id
          content
        }
      }
    }
  }
`;

// TypeScript Interfaces
export interface PageNode {
  id: string;
  content: string;
}

export interface PageEdge {
  node: PageNode;
}

export interface OnlineDealersData {
  pages: {
    edges: PageEdge[];
  };
}
