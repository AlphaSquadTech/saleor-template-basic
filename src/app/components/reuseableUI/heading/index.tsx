import { ReactNode } from "react";

interface HeadingProps {
  content: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export default function Heading({
  content,
  className,
  as: Tag = "h2",
}: HeadingProps) {
  return (
    <Tag
      style={{ color: "var(--color-secondary-75)" }}
      className={`text-2xl md:text-3xl lg:text-5xl uppercase font-primary -tracking-[0.12px] ${className}`}
    >
      {content}
    </Tag>
  );
}
