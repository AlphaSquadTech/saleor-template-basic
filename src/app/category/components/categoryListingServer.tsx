import { CategoryAPIType } from "@/lib/api/shop";
import EmptyState from "../../components/reuseableUI/emptyState";
import CategoryListingRenderer from "./categoryListing";

async function fetchCategories(): Promise<CategoryAPIType[]> {
  try {
    const partsLogicUrl = process.env.NEXT_PUBLIC_PARTSLOGIC_URL || "";
    if (!partsLogicUrl) {
      console.warn("PARTSLOGIC_URL not configured, skipping categories fetch");
      return [];
    }
    const url = `${partsLogicUrl}/api/categories?page=1&per_page=100`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.status}`);
    }

    const data = await res.json();
    return data.categories || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export const CategoryListingServer = async () => {
  const categories = await fetchCategories();

  return (
    <section className="py-8 lg:px-0">
      {!categories.length ? (
        <div className="w-full">
          <EmptyState
            text="No categories available"
            textParagraph="Categories will appear here once they are added"
            className="h-[40vh] mt-16"
          />
        </div>
      ) : (
        <CategoryListingRenderer categories={categories} />
      )}
    </section>
  );
};
