/** @type {import('next-sitemap').IConfig} */

const PARTSLOGIC_URL = process.env.NEXT_PUBLIC_PARTSLOGIC_URL || '';
// Expect a full Saleor GraphQL endpoint in NEXT_PUBLIC_API_URL (or leave unset to skip CMS-backed sitemap paths).
const SALEOR_API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function isProductionRobots() {
  // Block indexing for preview/staging/local environments.
  // Vercel sets VERCEL_ENV to 'production' | 'preview' | 'development'.
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase();
  if (vercelEnv && vercelEnv !== 'production') return false;
  if (SITE_URL.includes('localhost') || SITE_URL.includes('127.0.0.1')) return false;
  return true;
}

const ROBOTS_ALLOW_INDEXING = isProductionRobots();

async function fetchAllProducts() {
  // IMPORTANT:
  // The Basic Template PDP is Saleor-backed. Generating product sitemap entries from PartsLogic
  // can produce URLs that 404 on the storefront (slug mismatch). Use Saleor as source of truth.
  if (!SALEOR_API_URL) return [];

  const channel = process.env.NEXT_PUBLIC_SALEOR_CHANNEL || "default-channel";
  const products = [];
  const first = 100;
  let after = null;
  let hasNext = true;

  const query = `
    query SitemapProducts($first: Int!, $after: String, $channel: String!) {
      products(first: $first, after: $after, channel: $channel) {
        edges {
          node {
            slug
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  while (hasNext) {
    try {
      const res = await fetch(SALEOR_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { first, after, channel } }),
      });
      if (!res.ok) break;
      const json = await res.json();
      const edges = json?.data?.products?.edges || [];
      edges.forEach((e) => {
        if (e?.node?.slug) products.push(e.node);
      });
      hasNext = Boolean(json?.data?.products?.pageInfo?.hasNextPage);
      after = json?.data?.products?.pageInfo?.endCursor || null;
      if (!hasNext) break;
    } catch (error) {
      console.error("Error fetching Saleor products:", error);
      break;
    }
  }

  console.log(`Fetched ${products.length} products for sitemap (Saleor)`);
  return products;
}

async function fetchAllCategories() {
  if (!PARTSLOGIC_URL) return [];
  try {
    const res = await fetch(`${PARTSLOGIC_URL}/api/categories?per_page=100`);
    if (!res.ok) return [];
    const data = await res.json();

    // Flatten nested categories
    const flattenCategories = (cats, result = []) => {
      for (const cat of cats) {
        if (cat.slug && cat.product_count > 0) {
          result.push(cat);
        }
        if (cat.children) {
          flattenCategories(cat.children, result);
        }
      }
      return result;
    };

    const categories = flattenCategories(data.categories || []);
    console.log(`Fetched ${categories.length} categories for sitemap`);
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function fetchAllBrands() {
  if (!PARTSLOGIC_URL) return [];
  try {
    const res = await fetch(`${PARTSLOGIC_URL}/api/brands?per_page=100`);
    if (!res.ok) return [];
    const data = await res.json();
    const brands = (data.brands || []).filter(b => b.product_count > 0);
    console.log(`Fetched ${brands.length} brands for sitemap`);
    return brands;
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}

async function fetchAllBlogs() {
  if (!SALEOR_API_URL) return [];
  try {
    // First, get the page type ID for articles-blogs
    const pageTypeQuery = `
      query GetBlogPageType {
        pageTypes(first: 100, filter: { slugs: "articles-blogs" }) {
          edges {
            node {
              id
              name
              slug
            }
          }
        }
      }
    `;

    const pageTypeRes = await fetch(SALEOR_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: pageTypeQuery }),
    });

    if (!pageTypeRes.ok) {
      console.error('Failed to fetch blog page type');
      return [];
    }

    const pageTypeData = await pageTypeRes.json();
    const pageTypeId = pageTypeData?.data?.pageTypes?.edges?.[0]?.node?.id;

    if (!pageTypeId) {
      console.warn('Blog page type "articles-blogs" not found');
      return [];
    }

    // Then fetch all pages with this page type
    const pagesQuery = `
      query GetBlogPages($pageTypeId: [ID!]) {
        pages(first: 100, filter: { pageTypes: $pageTypeId }) {
          edges {
            node {
              id
              title
              slug
              created
            }
          }
        }
      }
    `;

    const pagesRes = await fetch(SALEOR_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: pagesQuery,
        variables: { pageTypeId: [pageTypeId] },
      }),
    });

    if (!pagesRes.ok) {
      console.error('Failed to fetch blog pages');
      return [];
    }

    const pagesData = await pagesRes.json();
    const pages = pagesData?.data?.pages?.edges || [];

    const blogs = pages
      .map(edge => edge?.node)
      .filter(node => node?.slug);

    console.log(`Fetched ${blogs.length} blogs for sitemap`);
    return blogs;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }
}

module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/search',
    '/checkout',
    '/checkout/*',
    '/cart',
    '/order-confirmation',
    '/order-confirmation/*',
    '/account',
    '/account/*',
    '/orders',
    '/orders/*',
    '/settings',
    '/settings/*',
    '/api/*',
    '/authorize-net-success',
  ],

  robotsTxtOptions: {
    policies: ROBOTS_ALLOW_INDEXING
      ? [
          {
            userAgent: '*',
            allow: '/',
            disallow: [
              '/checkout/',
              '/checkout',
              '/cart',
              '/order-confirmation/',
              '/order-confirmation',
              '/account/',
              '/account',
              '/orders/',
              '/orders',
              '/settings/',
              '/settings',
              '/api/',
              '/authorize-net-success',
            ],
          },
        ]
      : [
          {
            userAgent: '*',
            disallow: '/',
          },
        ],
  },

  transform: async (config, path) => {
    let priority = 0.7, changefreq = 'weekly';
    if (path === '/') { priority = 1.0; changefreq = 'daily'; }
    else if (path.startsWith('/category') || path === '/products/all') { priority = 0.9; changefreq = 'daily'; }
    else if (path.startsWith('/product/') || path.startsWith('/brand/')) { priority = 0.8; }
    else if (path.startsWith('/blog/')) { priority = 0.6; changefreq = 'monthly'; }
    else if (['/privacy-policy', '/terms-and-conditions', '/warranty', '/shipping-returns'].includes(path)) { priority = 0.5; changefreq = 'yearly'; }
    return { loc: path, changefreq, priority, lastmod: new Date().toISOString() };
  },

  additionalPaths: async (config) => {
    const paths = [];

    // Products (with pagination)
    const products = await fetchAllProducts();
    products.forEach(p => paths.push({
      loc: `/product/${encodeURIComponent(p.slug)}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    }));

    // Categories (flattened from hierarchy)
    const categories = await fetchAllCategories();
    categories.forEach(c => paths.push({
      loc: `/category/${encodeURIComponent(c.slug)}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    }));

    // Brands
    const brands = await fetchAllBrands();
    brands.forEach(b => paths.push({
      loc: `/brand/${encodeURIComponent(b.slug)}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    }));

    // Blog posts (fetched dynamically from Saleor CMS)
    const blogs = await fetchAllBlogs();
    blogs.forEach(blog => paths.push({
      loc: `/blog/${encodeURIComponent(blog.slug)}`,
      changefreq: 'monthly',
      priority: 0.6,
      lastmod: blog.created ? new Date(blog.created).toISOString() : new Date().toISOString(),
    }));

    console.log(`Total additional paths: ${paths.length}`);
    return paths;
  },
};
