"use client";
import React, { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useVehicleData } from "@/hooks/useVehicleData";
import { useYmmStore } from "@/store/useYmmStore";

interface YMMBarProps {
  onSearch?: (fitment: string) => void;
  className?: string;
}

export const YMMBar = ({ onSearch, className }: YMMBarProps) => {
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
    if (!isSearchPage || !initialPairs) {
      return;
    }

    if (previousPairsRef.current === initialPairs) {
      return;
    }

    if (rootTypes.length === 0) {
      return;
    }

    previousPairsRef.current = initialPairs;
    initializeFromPairs(initialPairs);
  }, [initialPairs, isSearchPage, rootTypes]);

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

    if (isSearchPage) {
      router.push(`/search`);
    }

    if (rootTypes.length > 0) {
      setTimeout(() => {
        handleRootTypeChange(rootTypes[0].id);
      }, 100);
    }
  };

  const hasSelectedFilters = dropdownLevels.some(
    (level) => level.selectedValue !== ""
  );

  if (!isYmmActive) {
    return null;
  }

  return (
    <div className={`w-full bg-[#FFDB60] ${className || ""}`}>
      <div className="container mx-auto px-4 py-3 md:py-4 overflow-hidden">
        <div className="flex flex-col xl:flex-row items-center gap-3 xl:gap-4">
          {/* Title with decorative slashes */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[#E67E22] font-black font-primary text-xl tracking-tighter">
              {"///"}
            </span>
            <span className="font-primary text-sm md:text-2xl font-black tracking-wide text-[#1a1a1a] whitespace-nowrap">
              FIND YOUR PERFECT FIT
            </span>
          </div>

          {/* Dropdowns and buttons container */}
          <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-2 md:gap-3 w-full xl:w-auto xl:flex-1">
            {/* Dynamic Dropdown Levels - show first 3 */}
            {dropdownLevels.length > 0
              ? dropdownLevels.slice(0, 3).map((level, index) => {
                  const selectId = `ymm-bar-${level.typeName.toLowerCase()}-${index}`;

                  return (
                    <div
                      key={`${level.typeId}-${index}`}
                      className="relative flex-1 min-w-0 md:min-w-[120px]"
                    >
                      <select
                        id={selectId}
                        value={level.selectedValue}
                        onChange={(e) => {
                          const valueId =
                            level.values.find(
                              (v) => (v.value || v.name) === e.target.value
                            )?.id || 0;
                          handleValueChange(index, valueId, e.target.value);
                        }}
                        disabled={level.values.length === 0}
                        aria-label={`Select ${level.typeName}`}
                        className="w-full h-10 sm:h-11 px-3 pr-8 bg-[#1a1a1a] text-white text-sm font-medium appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
                      >
                        <option value="" disabled>
                          {level.typeName.toUpperCase()}
                        </option>
                        {level.values
                          .sort((a, b) =>
                            (a.value || a.name || "").localeCompare(
                              b.value || b.name || ""
                            )
                          )
                          .map((v) => (
                            <option key={v.id} value={v.value || v.name || ""}>
                              {v.value || v.name || ""}
                            </option>
                          ))}
                      </select>
                      {/* Custom dropdown arrow */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  );
                })
              : Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative flex-1 min-w-0 md:min-w-[120px]"
                  >
                    <div className="w-full h-10 sm:h-11 bg-[#1a1a1a] animate-pulse rounded-sm" />
                    {/* Skeleton dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <div className="w-4 h-4 bg-gray-600 rounded animate-pulse" />
                    </div>
                  </div>
                ))}

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="h-10 sm:h-11 px-6 bg-[#1a1a1a] text-white text-sm font-bold tracking-wide hover:bg-[#333] transition-colors cursor-pointer shrink-0"
            >
              SEARCH
            </button>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              disabled={!hasSelectedFilters}
              className="h-10 sm:h-11 px-6 bg-white text-[#1a1a1a] text-sm font-bold tracking-wide border-2 border-[#1a1a1a] hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              CLEAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
