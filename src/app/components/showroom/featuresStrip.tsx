import Image from "next/image";
import createApolloServerClient from "@/graphql/server-client";
import {
  GET_PAGE_METADATA_BY_SLUG,
  type PageMetadataResponse,
} from "@/graphql/queries/getHeroMetadata";

export const FeaturesStrip = async ({
  slug,
  className,
}: {
  slug?: string;
  className?: string;
}) => {
  // Fetch page metadata for features-strip
  let meta: Record<string, string> = {};
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const client = createApolloServerClient();
      const { data } = await client.query<PageMetadataResponse>({
        query: GET_PAGE_METADATA_BY_SLUG,
        variables: { slug: slug || "features-strip" },
        fetchPolicy: "network-only",
        errorPolicy: "ignore",
      });
      const items = data?.page?.metadata ?? [];
      meta = Object.fromEntries(items.map((m) => [m.key, m.value ?? ""]));
    } catch {
      // Silent fallback to defaults below
    }
  }

  const extractIconSrc = (raw?: string | null): string => {
    const fallback = "/star.svg";
    if (!raw) return fallback;
    const val = raw.trim();
    // Strip leading 'background-image:' if present
    const withoutProp = val.replace(/^background-image\s*:\s*/i, "");
    const match = withoutProp.match(/url\(([^)]+)\)/i);
    if (match) {
      let url = match[1].trim();
      if (
        (url.startsWith('"') && url.endsWith('"')) ||
        (url.startsWith("'") && url.endsWith("'"))
      ) {
        url = url.slice(1, -1);
      }
      return url || fallback;
    }
    // If it's already a direct url/path/data uri
    if (
      val.startsWith("/") ||
      val.startsWith("http") ||
      val.startsWith("data:")
    )
      return val;
    return fallback;
  };

  const h1 = meta["feature_1_heading"] || "Original Products";
  const t1 =
    meta["feature_1_text"] || "Creative designs that elevate daily items.";
  const i1 = extractIconSrc(meta["feature_1_icon"]) || "/star.svg";
  const h2 = meta["feature_2_heading"] || "Affordable Rates";
  const t2 =
    meta["feature_2_text"] || "Explore affordable prices for everyone here!";
  const i2 = extractIconSrc(meta["feature_2_icon"]) || "/star.svg";
  const h3 = meta["feature_3_heading"] || "Wide variety";
  const t3 = meta["feature_3_text"] || "Explore a range of unique offerings.";
  const i3 = extractIconSrc(meta["feature_3_icon"]) || "/star.svg";

  return (
    <section
      className={`relative isolate bg-[var(--color-primary)] px-4 md:px-6 lg:px-20 overflow-hidden ${className}`}
      aria-label="Store features"
    >
      {/* Texture overlays */}
      <Image
        src="/images/BackgroundNoise.png"
        className="absolute inset-0 size-full object-cover opacity-60 mix-blend-multiply pointer-events-none"
        alt=""
        aria-hidden
        fill
        priority
      />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl w-full py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-stretch justify-between">
          {/* Feature 1 */}
          <div className="flex items-center gap-4 py-4 md:py-0 md:px-8">
            <Image
              src={i1}
              alt={`${h1} icon`}
              width={40}
              height={40}
              priority
              unoptimized={i1.startsWith("data:")}
            />
            <div className="leading-none">
              <p className="font-primary uppercase text-[var(--color-secondary-910)] text-2xl leading-8 tracking-tight">
                {h1}
              </p>
              <p className="font-secondary text-[var(--color-secondary-910)] text-base leading-6">
                {t1}
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-4 py-4 md:py-0 md:px-8">
            <Image
              src={i2}
              alt={`${h2} icon`}
              width={40}
              height={40}
              unoptimized={i2.startsWith("data:")}
            />
            <div className="leading-none">
              <p className="font-primary uppercase text-[var(--color-secondary-910)] text-2xl leading-8 tracking-tight">
                {h2}
              </p>
              <p className="font-secondary text-[var(--color-secondary-910)] text-base leading-6">
                {t2}
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-4 py-4 md:py-0 md:px-8">
            <Image
              src={i3}
              alt={`${h3} icon`}
              width={40}
              height={40}
              unoptimized={i3.startsWith("data:")}
            />
            <div className="leading-none">
              <p className="font-primary uppercase text-[var(--color-secondary-910)] text-2xl leading-8 tracking-tight">
                {h3}
              </p>
              <p className="font-secondary text-[var(--color-secondary-910)] text-base leading-6">
                {t3}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
