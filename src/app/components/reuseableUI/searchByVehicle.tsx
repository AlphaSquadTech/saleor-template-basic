"use client";
import React, { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PrimaryButton from "./primaryButton";
import Select from "./select";
import { useVehicleData } from "@/hooks/useVehicleData";
import { useYmmStore } from "@/store/useYmmStore";

interface SelectInputProps {
  onSearch?: (fitment: string) => void;
  className?: string;
  AddClearButton?: boolean;
}

export const SearchByVehicle = ({
  onSearch,
  className,
  AddClearButton = false,
}: SelectInputProps) => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isYmmActive = useYmmStore((state) => state.isYmmActive);
  const previousPairsRef = useRef<string | null>(null);
  const isSearchPage = pathname === "/search";

  const {
    rootTypes,
    selectedRootType,
    dropdownLevels,
    handleRootTypeChange,
    handleValueChange,
    isComplete,
    getSelectedPairs,
    initializeFromPairs,
    resetInitialization,
  } = useVehicleData();

  const initialPairs = params.get("fitment_pairs");

  useEffect(() => {
    if (
      rootTypes.length > 0 &&
      selectedRootType === 0 &&
      dropdownLevels.length === 0 &&
      !initialPairs
    ) {
      handleRootTypeChange(rootTypes[0].id);
    }
  }, [rootTypes]);

  useEffect(() => {
    // Only initialize if we're on the search page AND we have fitment_pairs
    if (!isSearchPage || !initialPairs) {
      return;
    }

    // Prevent re-initialization if pairs haven't changed
    if (previousPairsRef.current === initialPairs) {
      return;
    }

    if (rootTypes.length === 0) {
      return;
    }

    previousPairsRef.current = initialPairs;
    initializeFromPairs(initialPairs);
  }, [initialPairs, isSearchPage, rootTypes]);

  // Reset when leaving the search page or pairs are cleared
  useEffect(() => {
    return () => {
      if (isSearchPage) {
        resetInitialization();
        previousPairsRef.current = null;
      }
    };
  }, [isSearchPage]);

  const handleSearch = () => {
    const pairs = getSelectedPairs();
    if (onSearch) {
      onSearch(pairs);
    } else {
      router.push(`/search?fitment_pairs=${pairs}`);
    }
  };

  const handleClear = () => {
    resetInitialization();
    previousPairsRef.current = null;

    // Only navigate if we're on the search page
    if (isSearchPage) {
      router.push(`/search`);
    }

    if (rootTypes.length > 0) {
      setTimeout(() => {
        handleRootTypeChange(rootTypes[0].id);
      }, 100);
    }
  };

  // Check if any filter is selected
  const hasSelectedFilters = dropdownLevels.some(
    (level) => level.selectedValue !== ""
  );

  if (!isYmmActive) {
    return null;
  }

  return (
    <div
      style={{ backgroundColor: "var(--color-secondary-920)" }}
      className={`p-6 lg:px-8 lg:py-10 flex flex-col items-start flex-wrap gap-4 md:gap-5 relative ${
        className && className
      }`}
    >
      <h2 className="font-secondary text-lg md:text-[24px] font-bold leading-6 md:leading-[32px] tracking-[-0.06px] text-[var(--color-secondary-75)]">
        SEARCH BY VEHICLE
      </h2>

      <div className="lg:max-h-[168px] lg:overflow-y-auto w-full hide-scrollbar">
        {/* Dynamic Dropdown Levels */}
        {dropdownLevels.length > 0 ? (
          dropdownLevels.map((level, index) => {
            const selectId = `vehicle-${level.typeName.toLowerCase()}-${index}`;

            return (
              <Select
                key={`${level.typeId}-${index}`}
                htmlFor={selectId}
                value={level.selectedValue}
                onChange={(e) => {
                  const valueId =
                    level.values.find(
                      (v) => (v.value || v.name) === e.target.value
                    )?.id || 0;
                  handleValueChange(index, valueId, e.target.value);
                }}
                options={level.values.sort((a, b) => (a.value || a.name || "").localeCompare(b.value || b.name || "")).map((v) => ({
                  value: v.value || v.name || "",
                  label: v.value || v.name || "",
                }))}
                placeholder={`SELECT ${level.typeName.toUpperCase()}`}
                parentClassName="w-full mb-3 last:mb-0"
                disabled={level.values.length === 0}
                aria-label={`Select ${level.typeName}`}
              />
            );
          })
        ) : (
          // Show placeholder selects to prevent layout shift
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-12 bg-[var(--color-secondary-50)] border border-gray-300 rounded mb-3 last:mb-0 flex items-center px-4 text-gray-400"
            >
              Loading...
            </div>
          ))
        )}
      </div>
      <div className="flex flex-row-reverse lg:flex-col gap-4 w-full">
        <PrimaryButton
          content="SEARCH"
          className="leading-[150%] py-3 w-full text-white"
          onClick={handleSearch}
        />
        {AddClearButton && (
          <button
            onClick={handleClear}
            disabled={!hasSelectedFilters}
            className="w-full h-12 cursor-pointer bg-white border border-[var(--color-secondary-300)] text-[var(--color-secondary-800)] font-semibold hover:bg-[var(--color-secondary-50)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            CLEAR
          </button>
        )}
      </div>
    </div>
  );
};
