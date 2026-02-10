"use client";

import { useEffect } from "react";
import { useYmmStore } from "@/store/useYmmStore";

export default function YMMStatusProvider() {
  const checkYmmStatus = useYmmStore((state) => state.checkYmmStatus);

  useEffect(() => {
    // Check YMM API status on app load
    checkYmmStatus();
  }, [checkYmmStatus]);

  return null;
}
