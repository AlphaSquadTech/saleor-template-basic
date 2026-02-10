"use client";
import type { CategoryAPIType } from "@/lib/api/shop";
import React from "react";
import { CategoryCard } from "../../components/reuseableUI/categoryCard";

interface CategorySwiperProps {
  categories: CategoryAPIType[];
}

const CategoryListingRenderer: React.FC<CategorySwiperProps> = ({
  categories,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {categories.map((c, idx) => (
        <CategoryCard
          key={idx}
          id={c?.id}
          name={c?.name}
          image={c?.image ?? "/images/categoryfallback.png"}
          href={`/category/${c?.slug}`}
          description={c?.name ?? ""}
        />
      ))}
    </div>
  );
};

export default CategoryListingRenderer;
