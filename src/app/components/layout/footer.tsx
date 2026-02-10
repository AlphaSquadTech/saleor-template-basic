import Link from "next/link";
import SocialLinks from "./socialLinks";
import SiteInfo from "./siteInfo";
import Image from "next/image";
import type { ReactNode } from "react";
import { fetchMenuBySlug } from "@/graphql/queries/getMenuBySlug";
import { X } from "../../../../public/footer/x";
import { facebook } from "../../../../public/footer/facebook";
import { Instagram } from "../../../../public/footer/instagram";
import { getStoreName } from "@/app/utils/branding";

// Define types for footer sections and menu items
type FooterChild = {
  id: string;
  name: string;
  href?: string;
  url?: string;
  metadata?: Array<{
    key: string;
    value: string;
  }>;
};

type FooterSection = {
  id: string;
  name: string;
  url?: string;
  children: FooterChild[];
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{ color: "var(--color-primary-600)" }}
    className="font-semibold text-lg text-center md:text-left lg:text-right"
  >
    {children}
  </span>
);

type SocialIcon = { icon: ReactNode; link: string; label: string };

const SocialIcons: SocialIcon[] = (() => {
  const items: SocialIcon[] = [];
  const fb = process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL;
  const x = process.env.NEXT_PUBLIC_SOCIAL_X_URL;
  const ig = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL;

  if (fb) items.push({ icon: facebook, link: fb, label: "Facebook" });
  if (x) items.push({ icon: X, link: x, label: "X (Twitter)" });
  if (ig) items.push({ icon: Instagram, link: ig, label: "Instagram" });

  return items;
})();

// ---------- STATIC SECTIONS ----------
const STATIC_SECTIONS: FooterSection[] = [
  {
    id: "support",
    name: "SUPPORT",
    children: [
      { id: "contact", name: "Contact", href: "/contact" },
      { id: "faq", name: "Become a Dealer", href: "/dealer-application" },
    ],
  },
];

const getTargetFromMetadata = (
  metadata?: Array<{ key: string; value: string }>
) => {
  const targetMetadata = metadata?.find((meta) => meta.key === "target");
  return targetMetadata?.value === "_blank" ? "_blank" : "_self";
};

const Footer = async () => {
  const currentYear = new Date().getFullYear();
  const storeName = getStoreName();
  // Fetch footer menu data from backend
  const footerMenu = await fetchMenuBySlug("footer");
  // Always show static data, add dynamic data if available
  const dynamicSections: FooterSection[] =
    footerMenu &&
    typeof footerMenu === "object" &&
    "items" in footerMenu &&
    Array.isArray(footerMenu.items) &&
    footerMenu.items.length > 0
      ? (
          footerMenu.items as Array<{
            id: string;
            name: string;
            url: string;
            children?: Array<{
              id: string;
              name: string;
              href: string;
              url: string;
              metadata?: Array<{
                key: string;
                value: string;
              }>;
            }>;
          }>
        ).map((item) => ({
          id: item.id,
          name: item.name,
          url: item.url,
          children:
            item.children?.map((child) => ({
              id: child.id,
              name: child.name,
              href: child.href,
              url: child.url,
              metadata: child.metadata,
            })) || [],
        }))
      : [];

  // Combine static sections with dynamic sections
  const sectionsToRender: FooterSection[] = [
    ...dynamicSections,
    ...STATIC_SECTIONS,
  ];
  return (
    <footer style={{ backgroundColor: "var(--color-secondary-950)" }}>
      <div className="bg-[url('/images/footer-background.png')] container mx-auto px-6 pt-6 md:pt-10 lg:pt-12 pb-6">
        <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-12 pb-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className=" flex gap-3">
              {SocialIcons.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="[&>svg]:size-6 [&>svg]:block [&>svg]:shrink-0 [&>svg]:text-white block bg-white hover:scale-105 transition-all ease-in-out duration-300 p-1.5 rounded-full"
                >
                  {item.icon}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <Image
                src={process.env.NEXT_PUBLIC_LOGO_URL || "/Logo.png"}
                alt={`${storeName} Logo`}
                width={80}
                height={80}
                sizes="100vw"
                className="w-20 h-20 md:w-28 md:h-28 lg:w-44 lg:h-44 object-contain"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 font-secondary gap-6 lg:gap-4 w-full -tracking-wide">
            {sectionsToRender.map((section) => (
              <div key={section.id} className="flex flex-col w-full gap-3">
                <SectionTitle>
                  <Link href={section.url || ""}>{section.name}</Link>
                </SectionTitle>
                <div className="flex flex-col gap-2">
                  {section.children.map((child) => {
                    return (
                      <Link
                        prefetch={false}
                        key={child.id}
                        href={child.url ? child.url : child.href || "#"}
                        target={getTargetFromMetadata(child.metadata)}
                        rel={
                          getTargetFromMetadata(child.metadata) === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        style={{ color: "var(--color-secondary-50)" }}
                        className="text-base hover:opacity-80 transition-opacity text-center md:text-left lg:text-right"
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <SiteInfo />
          </div>
        </div>
        <div className="flex w-full flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 mb-4">
          <SocialLinks />
        </div>
        <p className="font-normal text-center text-sm font-secondary text-[var(--color-secondary-50)] uppercase">
          <strong>
            Copyright © {currentYear} {storeName}. All Rights Reserved.&nbsp;
          </strong>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
