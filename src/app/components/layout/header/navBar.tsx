import Link from "next/link";
import { NavbarBrand } from "./components/NavbarBrand";
import { navbarStyles } from "./styles/navbarStyles";
import type { CategoryNode, MenuItem } from "./utils/serverNavbarData";
import { ChevronDownIcon } from "@/app/utils/svgs/chevronDownIcon";

interface NavBarProps {
  categories: CategoryNode[];
  menuItems: MenuItem[];
}

const DEFAULT_BRAND = "Saleor Storefront";
const DEFAULT_LOGO = "https://webshopmanager.com/files/images/logo.png";

function getBrandConfig() {
  const brandName =
    process.env.NEXT_PUBLIC_BRAND_NAME ||
    process.env.NEXT_PUBLIC_TENANT_NAME ||
    DEFAULT_BRAND;
  const logo = process.env.NEXT_PUBLIC_LOGO_URL || DEFAULT_LOGO;
  return { brandName, logo };
}

function getTargetFromMetadata(
  metadata?: Array<{ key: string; value: string }>
) {
  const target = metadata?.find((m) => m.key === "target")?.value;
  return target === "_blank" ? "_blank" : "_self";
}

function ProductsDropdown({ categories }: { categories: CategoryNode[] }) {
  return (
    <div
      style={{ backgroundColor: "white" }}
      className="absolute top-full left-0 z-50 mt-1 max-h-[400px] w-[340px] overflow-y-auto px-6 py-6 shadow-[0_10px_20px_0_rgba(0,0,0,0.10)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity"
    >
      {categories.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-semibold uppercase text-[var(--color-secondary-800)] font-secondary">
            No Categories Found
          </p>
          <p className="mt-1 text-xs text-[var(--color-secondary-600)] font-secondary">
            Categories will appear here when available.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-10">
            {categories.map((category) => (
              <div key={category.id} className="group/category">
                <Link
                  href={`/category/${encodeURIComponent(
                    category.slug || category.id
                  )}`}
                  className="text-sm font-semibold uppercase leading-4 tracking-[-0.03px] inline-block hover:text-[var(--color-primary-500)] transition-all duration-300"
                >
                  {category.name}
                </Link>
                {category.children?.length ? (
                  <ul className="mt-3 space-y-2">
                    {[...category.children]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((child) => (
                        <li
                          key={child.id}
                          className="text-sm leading-4 tracking-[-0.03px]"
                        >
                          <Link
                            href={`/category/${encodeURIComponent(
                              child.slug || child.id
                            )}`}
                            className="text-[var(--color-secondary-600)] hover:text-[var(--color-primary-500)] transition-all duration-300"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <Link
              href="/products/all"
              className="px-6 py-2 text-sm font-medium text-white hover:text-[var(--color-primary-600)] border hover:border-[var(--color-primary)] hover:bg-transparent bg-[var(--color-secondary-100)] transition-all duration-300"
            >
              View All Products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItemDropdownServer({ item }: { item: MenuItem }) {
  return (
    <div className="relative group">
      <Link
        href={item.url}
        target={getTargetFromMetadata(item.metadata)}
        rel={
          getTargetFromMetadata(item.metadata) === "_blank"
            ? "noopener noreferrer"
            : undefined
        }
        className={`${navbarStyles.navLinkBase} ${navbarStyles.navLinkInactive} whitespace-nowrap flex items-center gap-2`}
        aria-haspopup="menu"
      >
        <span>{item.name}</span>
        <span className="size-4" aria-hidden="true">
          {ChevronDownIcon}
        </span>
      </Link>

      <div
        style={{ backgroundColor: "white" }}
        className="absolute top-full left-0 z-50 mt-1 min-w-48 rounded-sm shadow-[0_10px_20px_0_rgba(0,0,0,0.10)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity"
      >
        <div className="py-2">
          {(item.children || []).map((child) => (
            <Link
              key={child.id}
              href={child.url}
              target={getTargetFromMetadata(child.metadata)}
              rel={
                getTargetFromMetadata(child.metadata) === "_blank"
                  ? "noopener noreferrer"
                  : undefined
              }
              className="block px-4 py-2 text-sm text-[var(--color-secondary-800)] hover:bg-[var(--color-secondary-100)] hover:text-[var(--color-primary-500)] transition-colors whitespace-nowrap"
            >
              {child.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ categories, menuItems }: NavBarProps) {
  // Pure HTML/CSS mobile menu: no JS required.
  return (
    <div className={navbarStyles.mobileContainer}>
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex items-center gap-3">
          <details className="relative">
            <summary className="list-none cursor-pointer select-none text-white [&::-webkit-details-marker]:hidden">
              <span className="[&>svg]:size-5 inline-flex items-center">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M17.5 10C17.5 10.1658 17.4342 10.3247 17.3169 10.4419C17.1997 10.5592 17.0408 10.625 16.875 10.625H3.125C2.95924 10.625 2.80027 10.5592 2.68306 10.4419C2.56585 10.3247 2.5 10.1658 2.5 10C2.5 9.83424 2.56585 9.67527 2.68306 9.55806C2.80027 9.44085 2.95924 9.375 3.125 9.375H16.875C17.0408 9.375 17.1997 9.44085 17.3169 9.55806C17.4342 9.67527 17.5 9.83424 17.5 10ZM3.125 5.625H16.875C17.0408 5.625 17.1997 5.55915 17.3169 5.44194C17.4342 5.32473 17.5 5.16576 17.5 5C17.5 4.83424 17.4342 4.67527 17.3169 4.55806C17.1997 4.44085 17.0408 4.375 16.875 4.375H3.125C2.95924 4.375 2.80027 4.44085 2.68306 4.55806C2.56585 4.67527 2.5 4.83424 2.5 5C2.5 5.16576 2.56585 5.32473 2.68306 5.44194C2.80027 5.55915 2.95924 5.625 3.125 5.625ZM16.875 14.375H3.125C2.95924 14.375 2.80027 14.4408 2.68306 14.5581C2.56585 14.6753 2.5 14.8342 2.5 15C2.5 15.1658 2.56585 15.3247 2.68306 15.4419C2.80027 15.5592 2.95924 15.625 3.125 15.625H16.875C17.0408 15.625 17.1997 15.5592 17.3169 15.4419C17.4342 15.3247 17.5 15.1658 17.5 15C17.5 14.8342 17.4342 14.6753 17.3169 14.5581C17.1997 14.4408 17.0408 14.375 16.875 14.375Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </summary>

            <div className="absolute left-0 top-[48px] w-[min(90vw,360px)] rounded bg-white shadow-lg p-4 z-50">
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block text-sm font-secondary text-[var(--color-secondary-800)] hover:text-[var(--color-primary-500)]"
                >
                  Home
                </Link>
                <details>
                  <summary className="cursor-pointer text-sm font-secondary text-[var(--color-secondary-800)] hover:text-[var(--color-primary-500)] flex items-center justify-between">
                    <span>Products</span>
                    <span className="size-4" aria-hidden="true">
                      {ChevronDownIcon}
                    </span>
                  </summary>
                  <div className="mt-2 pl-3 space-y-2">
                    <Link
                      href="/products/all"
                      className="block text-sm text-[var(--color-secondary-700)] hover:text-[var(--color-primary-500)]"
                    >
                      View All Products
                    </Link>
                    {categories.map((c) => (
                      <div key={c.id} className="space-y-1">
                        <Link
                          href={`/category/${encodeURIComponent(
                            c.slug || c.id
                          )}`}
                          className="block text-sm text-[var(--color-secondary-800)] hover:text-[var(--color-primary-500)]"
                        >
                          {c.name}
                        </Link>
                        {c.children?.length ? (
                          <div className="pl-3 space-y-1">
                            {c.children.map((cc) => (
                              <Link
                                key={cc.id}
                                href={`/category/${encodeURIComponent(
                                  cc.slug || cc.id
                                )}`}
                                className="block text-sm text-[var(--color-secondary-700)] hover:text-[var(--color-primary-500)]"
                              >
                                {cc.name}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </details>

                {menuItems.length === 0 ? (
                  <>
                    <Link
                      href="/blog"
                      className="block text-sm font-secondary text-[var(--color-secondary-800)] hover:text-[var(--color-primary-500)]"
                    >
                      Blog
                    </Link>
                    <Link
                      href="/contact"
                      className="block text-sm font-secondary text-[var(--color-secondary-800)] hover:text-[var(--color-primary-500)]"
                    >
                      Contact
                    </Link>
                  </>
                ) : (
                  <div className="space-y-2">
                    {menuItems.map((item) =>
                      item.children?.length ? (
                        <details key={item.id}>
                          <summary className="cursor-pointer text-sm font-secondary text-[var(--color-secondary-800)] hover:text-[var(--color-primary-500)] flex items-center justify-between">
                            <span>{item.name}</span>
                            <span className="size-4" aria-hidden="true">
                              {ChevronDownIcon}
                            </span>
                          </summary>
                          <div className="mt-2 pl-3 space-y-2">
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                href={child.url}
                                target={getTargetFromMetadata(child.metadata)}
                                rel={
                                  getTargetFromMetadata(child.metadata) ===
                                  "_blank"
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                                className="block text-sm text-[var(--color-secondary-700)] hover:text-[var(--color-primary-500)]"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </details>
                      ) : (
                        <Link
                          key={item.id}
                          href={item.url}
                          target={getTargetFromMetadata(item.metadata)}
                          rel={
                            getTargetFromMetadata(item.metadata) === "_blank"
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="block text-sm font-secondary text-[var(--color-secondary-800)] hover:text-[var(--color-primary-500)]"
                        >
                          {item.name}
                        </Link>
                      )
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--color-secondary-200)]">
                  <Link
                    href="/locator"
                    className="block text-center px-4 py-2 font-secondary bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-all duration-300 text-[var(--color-secondary-50)] font-semibold uppercase text-base"
                  >
                    Where To Buy
                  </Link>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function DesktopNav({ categories, menuItems }: NavBarProps) {
  const brand = getBrandConfig();

  return (
    <nav className={navbarStyles.desktopContainer}>
      <div className={navbarStyles.linksContainer}>
        <NavbarBrand {...brand} />

        {/* Products dropdown */}
        <div className="relative group">
          <Link
            href="/products/all"
            className={`${navbarStyles.navLinkBase} ${navbarStyles.navLinkInactive} flex items-center gap-2`}
            aria-haspopup="menu"
          >
            <span>Products</span>
            <span className="size-4" aria-hidden="true">
              {ChevronDownIcon}
            </span>
          </Link>
          <ProductsDropdown categories={categories} />
        </div>

        {/* If no CMS menu configured, show basic links */}
        {menuItems.length === 0 ? (
          <>
            <Link
              href="/blog"
              className={`${navbarStyles.navLinkBase} ${navbarStyles.navLinkInactive} ${navbarStyles.navLinkWithUnderline}`}
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className={`${navbarStyles.navLinkBase} ${navbarStyles.navLinkInactive} ${navbarStyles.navLinkWithUnderline}`}
            >
              Contact
            </Link>
          </>
        ) : null}

        {/* CMS-driven menu items */}
        {menuItems.map((item) =>
          item.children?.length ? (
            <MenuItemDropdownServer key={item.id} item={item} />
          ) : (
            <Link
              key={item.id}
              href={item.url}
              target={getTargetFromMetadata(item.metadata)}
              rel={
                getTargetFromMetadata(item.metadata) === "_blank"
                  ? "noopener noreferrer"
                  : undefined
              }
              className={`${navbarStyles.navLinkBase} ${navbarStyles.navLinkInactive} whitespace-nowrap`}
            >
              {item.name}
            </Link>
          )
        )}
      </div>

      <div className={navbarStyles.actionsContainer}>
        {/* Server-rendered search (no JS required) */}
        <div className="flex w-full items-center justify-end">
          <form
            action="/products/all"
            method="get"
            className="flex items-center relative max-w-140 bg-white/10 px-4 py-2.5 max-h-10 justify-between w-full"
          >
            <input
              name="q"
              type="text"
              placeholder="Search by keyword or part number"
              className="w-full bg-transparent text-white placeholder:text-white/70 outline-none text-sm font-secondary"
            />
            <button
              type="submit"
              className="ml-3 text-white hover:text-[var(--color-primary-500)] transition-colors"
              aria-label="Search"
            >
              <span className="[&>svg]:size-4 inline-flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M8.75 15C12.2018 15 15 12.2018 15 8.75C15 5.29822 12.2018 2.5 8.75 2.5C5.29822 2.5 2.5 5.29822 2.5 8.75C2.5 12.2018 5.29822 15 8.75 15Z"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.1696 13.1696L17.5 17.5"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </form>
        </div>

        <Link
          href="/locator"
          className="shrink-0 px-4 py-2 font-secondary bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-all duration-300 text-[var(--color-secondary-50)] font-semibold uppercase text-base whitespace-nowrap"
        >
          Where To Buy
        </Link>
      </div>
    </nav>
  );
}

export const NavBar = ({ categories, menuItems }: NavBarProps) => {
  // This is intentionally server-rendered. It pulls menu/category data on the
  // server and outputs HTML so the main nav does not require client JS.
  return (
    <>
      <MobileMenu categories={categories} menuItems={menuItems} />
      <DesktopNav categories={categories} menuItems={menuItems} />
    </>
  );
};

