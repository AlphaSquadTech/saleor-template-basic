'use client'; 

import Link from 'next/link';
import Image from 'next/image';

export default function Error({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-white px-4 text-center">
      <Image
        src="/error-page-img.png"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="pointer-events-none select-none object-contain opacity-20 mix-blend-multiply"
      />

      <div className="relative space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
          Misfire
        </p>

        <h1 className="text-6xl font-bold tracking-tighter text-gray-900 sm:text-7xl">
          Not running on all cylinders
        </h1>

        <p className="mx-auto max-w-xl text-lg text-gray-500">
          We&apos;re having trouble getting this page up to speed. It&apos;s likely just a temporary glitch in the line.
        </p>

        <div className="flex items-center justify-center gap-4 pt-8">
          <button
            onClick={reset}
            className="rounded-md cursor-pointer bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Retry Ignition
          </button>

          <Link
            href="/"
            className="text-sm font-semibold text-gray-900 hover:text-gray-500 transition-colors"
          >
            Return Home <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}