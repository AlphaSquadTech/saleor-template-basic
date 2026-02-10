import Image from "next/image";
import Link from "next/link";
import { getFullImageUrl } from "@/app/utils/functions";

export interface ProductCardServerProps {
  id: string;
  name: string;
  image: string;
  href: string;
  price: number;
  category: string;
  onSale?: boolean;
  skus?: Array<string> | string;
}

export function ProductCardServer({
  id,
  name,
  image,
  href,
  price,
  category,
  onSale,
  skus,
}: ProductCardServerProps) {
  const fallbackImage = "/no-image-avail-large.png";
  const fullImageUrl = getFullImageUrl(image) || fallbackImage;
  const sku = Array.isArray(skus) ? skus[0] : skus;

  return (
    <Link
      href={href}
      key={id}
      style={{ border: "1px solid var(--color-secondary-220)" }}
      className="group block h-full overflow-hidden hover:shadow-lg transition-all duration-200 relative bg-[var(--color-secondary-920)] font-secondary"
    >
      {onSale ? (
        <span className="absolute top-2 right-2 z-10 px-3 py-1 text-xs font-semibold uppercase bg-[var(--color-primary-600)] text-white">
          Sale
        </span>
      ) : null}

      <div className="relative w-full flex flex-col gap-4 justify-between h-full">
        <div className="relative w-full aspect-square overflow-hidden">
          <Image
            src={fullImageUrl}
            alt={name}
            width={296}
            height={296}
            className="w-full h-full object-contain transition-all ease-in-out duration-300 group-hover:scale-105"
            priority={false}
          />
        </div>

        <div className="px-4 pb-4">
          <p
            style={{ color: "var(--color-primary-500)" }}
            className="font-normal text-xs font-secondary lg:text-sm -tracking-[0.035px]"
          >
            {category}
          </p>

          <p
            title={name}
            style={{ color: "var(--color-secondary-75)" }}
            className="-tracking-[0.05px] font-medium text-sm md:text-lg lg:text-xl line-clamp-2"
          >
            {name}
          </p>

          {sku ? (
            <p
              style={{ color: "var(--color-primary-700)" }}
              className="font-bold text-base md:text-xl -tracking-[0.06px] mt-3"
            >
              PART #: <span className="font-medium">{sku}</span>
            </p>
          ) : null}

          <div className="mt-3 text-base md:text-lg font-semibold text-[var(--color-secondary-75)]">
            ${price.toFixed(2)}
          </div>
        </div>
      </div>
    </Link>
  );
}

