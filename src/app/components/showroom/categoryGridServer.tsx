import type { CategoryAPIType } from "@/lib/api/shopTypes";
import React from "react";
import EmptyState from "../reuseableUI/emptyState";
import Heading from "../reuseableUI/heading";
import CategorySwiper from "./categorySwiper";

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

export const CategoryGridServer = async () => {
  const categories = await fetchCategories();

  return (
    <section
      className="py-12 px-4 md:px-6 md:py-16 lg:py-24 lg:px-0"
      style={{
        backgroundColor: "var(--color-secondary-920)",
      }}
    >
      {!categories.length ? (
        <div className="container mx-auto">
          <div className="flex w-full items-center justify-between ">
            <Heading content="Shop by Category" />
          </div>
          <EmptyState
            text="No categories available"
            textParagraph="Categories will appear here once they are added"
            className="h-[20vh] mt-16"
          />
        </div>
      ) : (
        <CategorySwiper categories={categories} />
      )}
    </section>
  );
};
