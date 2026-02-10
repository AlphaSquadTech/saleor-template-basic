"use client";

import dynamic from "next/dynamic";
import { useYmmStore } from "@/store/useYmmStore";
import { useEffect, useState } from "react";

const YMMBarSkeleton = () => (
  <div className="w-full bg-[#FFDB60]">
    <div className="container mx-auto px-4 py-3 md:py-4">
      <div className="flex flex-col xl:flex-row items-center gap-3 xl:gap-4">
        {/* Title skeleton */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-6 bg-[#E67E22]/30 rounded animate-pulse" />
          <div className="w-48 h-7 md:h-8 bg-[#1a1a1a]/20 rounded animate-pulse" />
        </div>

        {/* Dropdowns and buttons skeleton */}
        <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-2 md:gap-3 w-full xl:w-auto xl:flex-1">
          {/* Dropdown skeletons */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative flex-1 min-w-0 md:min-w-30">
              <div className="w-full h-10 sm:h-11 bg-[#1a1a1a] animate-pulse rounded-sm" />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <div className="w-4 h-4 bg-gray-600 rounded animate-pulse" />
              </div>
            </div>
          ))}

          {/* Button skeletons */}
          <div className="h-10 sm:h-11 w-full md:w-24 bg-[#1a1a1a] animate-pulse rounded-sm shrink-0" />
          <div className="h-10 sm:h-11 w-full md:w-24 bg-white/80 border-2 border-[#1a1a1a]/30 animate-pulse rounded-sm shrink-0" />
        </div>
      </div>
    </div>
  </div>
);

const YMMBar = dynamic(
  () => import("./ymmBar").then((mod) => ({ default: mod.YMMBar })),
  {
    ssr: false,
    loading: () => <YMMBarSkeleton />,
  }
);

export function YMMBarWrapper() {
  const isYmmActive = useYmmStore((state) => state.isYmmActive);
  const checkYmmStatus = useYmmStore((state) => state.checkYmmStatus);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !hasCheckedStatus) {
      checkYmmStatus().then(() => setHasCheckedStatus(true));
    }
  }, [checkYmmStatus, hasCheckedStatus, isMounted]);

  // Show skeleton while checking status (only after mount to prevent hydration issues)
  if (!isMounted || !hasCheckedStatus) {
    return <YMMBarSkeleton />;
  }

  // Only render YMMBar if YMM is active
  if (!isYmmActive) {
    return null;
  }

  return <YMMBar />;
}
