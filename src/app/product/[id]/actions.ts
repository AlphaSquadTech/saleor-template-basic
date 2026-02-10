"use server";

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_URL || "";

export async function getProductBySlug(slug: string) {
  if (!GRAPHQL_ENDPOINT) return null;
  const channel = process.env.NEXT_PUBLIC_SALEOR_CHANNEL || "default-channel";

  const query = `
    query ProductDetailsById($slug: String!, $channel: String!) {
      product(slug: $slug, channel: $channel) {
        id
        name
        slug
        description
        metadata {
          key
          value
        }
        category {
          id
          name
        }
        pricing {
          onSale
          priceRange {
            start {
              gross {
                amount
                currency
              }
            }
            stop {
              gross {
                amount
                currency
              }
            }
          }
          discount {
            gross {
              amount
              currency
            }
          }
        }
        media {
          id
          url
          alt
        }
        variants {
          id
          name
          sku
          quantityAvailable
          pricing {
            price {
              gross {
                amount
                currency
              }
            }
            priceUndiscounted {
              gross {
                amount
                currency
              }
            }
          }
          attributes {
            attribute {
              id
              slug
              name
            }
            values {
              id
              name
              slug
            }
          }
          weight {
            value
            unit
          }
        }
        attributes {
          attribute {
            id
            name
            slug
          }
          values {
            id
            name
            slug
          }
        }
        collections {
          id
          name
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { slug, channel },
      }),
      next: {
        revalidate: 300, // Cache for 5 minutes
        tags: [`product-${slug}`],
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return null;
    }

    return result.data?.product || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}
