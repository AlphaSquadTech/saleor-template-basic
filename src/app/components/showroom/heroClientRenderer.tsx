"use client";

import Image from "next/image";

type HeroClientProps = {
  title: string;
  description: string;
  bgSrc: string;
};

const HeroBackground = ({ src, alt }: { src?: string | null; alt: string }) => {
  const imageSrc = src?.trim() || "/images/hero-section-fallback.png";

  return (
    <div className="absolute inset-0 h-full">
      <Image
        src={imageSrc}
        alt={alt}
        width={1920}
        height={743}
        priority
        loading="eager"
        sizes="100vw"
        fetchPriority="high"
        className="w-full h-full object-cover object-center hidden lg:block"
      />
      <Image
        src={"/images/hero-section-fallback.png"}
        alt={alt}
        width={1920}
        height={743}
        priority
        loading="eager"
        sizes="100vw"
        fetchPriority="high"
        className="w-full h-full object-cover object-center lg:hidden"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/60" />
    </div>
  );
};

const HeroContent = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="w-full max-w-4xl text-left">
    <h1 className="text-neutral-100 text-2xl md:text-5xl lg:text-[64px] leading-none uppercase font-primary -tracking-[0.16px]">
      {title}
    </h1>
    <div className="pt-3 md:pt-4">
      <p className="font-secondary text-neutral-300 text-base md:text-[20px] lg:text-2xl tracking-[-0.06px] leading-normal max-w-2xl">
        THE EASIEST OIL CHANGE
      </p>
      <ul className="font-secondary text-neutral-300 text-sm md:text-[20px] lg:text-lg mt-2 list-disc list-inside">
        <li>Replaces Existing Drain Plug</li>
        <li>Fits Most Engines</li>
        <li>Easy Installation And Operation</li>
      </ul>
    </div>
  </div>
);

export function HeroClientRenderer({
  title,
  description,
  bgSrc,
}: HeroClientProps) {
  return (
    <section className="relative w-full h-[415px] md:h-112.5 lg:h-148">
      <HeroBackground src={bgSrc} alt={title} />

      <div className="container mx-auto relative h-full">
        <div className="h-full w-full px-4 flex items-center py-10 md:py-12 lg:py-20">
          <HeroContent title={title} description={description} />
        </div>
      </div>
    </section>
  );
}
