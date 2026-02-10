import LocatorClient from "./LocatorClient";
import { Suspense } from "react";

export default function LocatorPage() {
  return (
    <main className="min-h-[100dvh]">
      <div className="container mx-auto px-4 md:px-6 pt-12 md:pt-16 lg:pt-24">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--color-secondary-800)]">
          Store Locator
        </h1>
      </div>

      <Suspense
        fallback={
          <div className="container mx-auto py-12 px-4 md:px-6 md:py-16 lg:py-24 lg:px-0">
            <p className="text-[var(--color-secondary-600)]">Loading locator…</p>
          </div>
        }
      >
        <LocatorClient />
      </Suspense>
    </main>
  );
}
