import { gql } from "@apollo/client";

export const GET_DISTRIBUTORS = gql`
  query Distributors {
    pages(first: 10, filter: { slugs: "distributors" }) {
      edges {
        node {
          id
          content
        }
      }
    }
  }
`;
export interface PageNode {
  id: string;
  content: string;
}

export interface PageEdge {
  node: PageNode;
}
export interface DistributorsData {
  pages: {
    edges: PageEdge[];
  };
}
