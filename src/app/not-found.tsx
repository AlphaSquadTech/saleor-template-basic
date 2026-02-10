import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-white px-4 text-center">
      <Image
        src="/404-image.png"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="pointer-events-none select-none object-contain opacity-20 mix-blend-multiply"
      />

      <div className="relative space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
          Wrong Turn!
        </p>

        <h1 className="text-6xl font-bold tracking-tighter text-gray-900 sm:text-7xl">
          You’ve gone off-track
        </h1>

        <p className="mx-auto max-w-xl text-lg text-gray-500">
          We can&apos;t find the page you&apos;re looking for. Let&apos;s get this pony turned around and back on the open road.
        </p>

        <div className="pt-8">
          <Link
            href="/"
            className="rounded-md cursor-pointer bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 transition-colors focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}