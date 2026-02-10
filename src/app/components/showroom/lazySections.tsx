"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import {
  InstallationSection,
  InstallationSectionSkeleton,
} from "./installationSection";
import {
  IndustriesSection,
  IndustriesSectionSkeleton,
} from "./industriesSection";

interface LazyLoadProps {
  children: ReactNode;
  fallback: ReactNode;
  rootMargin?: string;
}

function LazyLoad({ children, fallback, rootMargin = "100px" }: LazyLoadProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return <div ref={ref}>{isVisible ? children : fallback}</div>;
}

export function LazyInstallationSection() {
  return (
    <LazyLoad fallback={<InstallationSectionSkeleton />}>
      <InstallationSection />
    </LazyLoad>
  );
}

export function LazyIndustriesSection() {
  return (
    <LazyLoad fallback={<IndustriesSectionSkeleton />}>
      <IndustriesSection />
    </LazyLoad>
  );
}
