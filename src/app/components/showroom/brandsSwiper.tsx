"use client";
import React, { useEffect } from "react";
import EmptyState from "../reuseableUI/emptyState";
import Heading from "../reuseableUI/heading";
import { BrandsSwiperClient } from "./brandsSwiperClient";
import type { CategoryAPIType } from "@/lib/api/shopTypes";
import { partsLogicClient } from "@/lib/client/partslogic";

export const BrandsSwiper = () => {
  const [brandsData, setBrands] = React.useState<CategoryAPIType[]>([]);

  useEffect(() => {
    const fetchBrandsData = async () => {
      try {
        const resp = await partsLogicClient.getBrands();
        if (resp.brands && Array.isArray(resp.brands)) setBrands(resp.brands);
      } catch (error) {
        console.error("Error fetching brands:", error);
        setBrands([]);
      }
    };
    fetchBrandsData();
  }, []);

  return (
    <section
      style={{
        backgroundColor: "var(--color-secondary-920)",
      }}
      className="py-12 px-4 md:px-6 md:py-16 lg:py-24 lg:px-0"
    >
      {!brandsData.length ? (
        <div className="container mx-auto">
          <div className="flex w-full items-center justify-between ">
            <Heading content=" Brands" />
          </div>
          <EmptyState
            text="No brands available"
            textParagraph="Check back later to see our featured brands."
            className="h-[20vh] mt-16"
          />
        </div>
      ) : (
        <BrandsSwiperClient brands={brandsData} />
      )}
    </section>
  );
};
