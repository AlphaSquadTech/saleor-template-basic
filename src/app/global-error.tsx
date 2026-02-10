'use client';

import Image from 'next/image';

export default function GlobalError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 text-center">
          <Image
            src="/global-error-page-img.png"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="pointer-events-none select-none object-contain opacity-20 mix-blend-multiply"
          />

          <div className="relative space-y-4">
            <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
              500 Error
            </p>

            <h1 className="text-6xl font-bold tracking-tighter text-gray-900 sm:text-7xl">
              Blown Gasket
            </h1>

            <p className="mx-auto max-w-xl text-lg text-gray-500">
              The whole system overheated. We need a hard reset to get you back in the driver&apos;s seat.
            </p>

            <div className="pt-8">
              <button
                onClick={() => reset()}
                className="rounded-md cursor-pointer bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}