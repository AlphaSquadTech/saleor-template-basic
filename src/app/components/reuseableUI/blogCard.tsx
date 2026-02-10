import Link from "next/link";

export interface CategoryCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  date?: string;
}

export const BlogCard = ({ id, title, slug, excerpt, date }: CategoryCardProps) => {
  return (
    <Link
      href={`/blog/${slug}`}
      key={id}
      className="flex flex-col justify-between min-h-32 gap-4 p-6 border border-[var(--color-secondary-200)] hover:border-[var(--color-primary-600)] hover:shadow-lg h-full transition-all duration-200 bg-white"
    >
        <h3 className="font-semibold leading-7 -tracking-[0.06px] font-secondary text-xl line-clamp-2 text-[var(--color-secondary-800)]">
          {title}
        </h3>

      <div className="text-[var(--color-primary-600)] text-sm font-medium">
        Read more →
      </div>
    </Link>
  );
};