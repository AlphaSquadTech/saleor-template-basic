import { cn } from "@/app/utils/functions";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDownIcon } from "@/app/utils/svgs/chevronDownIcon";
import PrimaryButton from "@/app/components/reuseableUI/primaryButton";

type MenuItem = {
  id: string;
  name: string;
  url: string;
  level: number;
  metadata?: Array<{
    key: string;
    value: string;
  }>;
  children?: MenuItem[];
};

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products/all" },
];

const HamMenuSlide = ({
  isHamMenuOpen,
  setIsHamMenuOpen,
  menuItems = [],
}: {
  isHamMenuOpen: boolean;
  setIsHamMenuOpen: (v: boolean) => void;
  menuItems?: MenuItem[];
}) => {
  const route = useRouter();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const pathName = usePathname();
  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getTargetFromMetadata = (
    metadata?: Array<{ key: string; value: string }>
  ) => {
    const targetMetadata = metadata?.find((meta) => meta.key === "target");
    return targetMetadata?.value === "_blank" ? "_blank" : "_self";
  };

  const handleNavigation = (
    url: string,
    metadata?: Array<{ key: string; value: string }>
  ) => {
    setIsHamMenuOpen(false);
    const target = getTargetFromMetadata(metadata);

    if (target === "_blank") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      route.push(url);
    }
  };

  useEffect(() => {
    // Prevent extension interference by validating the state
    const validatedState = Boolean(isHamMenuOpen);

    if (validatedState) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isHamMenuOpen]);
  return (
    <div
      className={cn(
        "fixed top-[112px] h-[calc(100vh-112px)] md:top-[121px] md:h-[calc(100vh-121px)] left-0 overflow-y-auto pb-4 w-full bg-white z-40 transition-all duration-[400ms] ease-in-out",
        Boolean(isHamMenuOpen) ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="py-6 px-4 md:px-6 flex flex-col">
        {NAV_LINKS.map((link) => (
          <div
            key={link.href}
            onClick={() => handleNavigation(link.href)}
            className={`block pb-4 hover:text-[var(--color-primary-500)] transition-all duration-300 ease-in-out cursor-pointer ${
              link.href === pathName
                ? "text-[var(--color-primary-500)]"
                : ""
            }`}
          >
            {link.name}
          </div>
        ))}

        {menuItems.map((item) => (
          <div key={item.id}>
            {item.children && item.children.length > 0 ? (
              <>
                <div
                  className="flex items-center justify-between pb-4 hover:text-[var(--color-primary-500)] transition-all duration-300 ease-in-out cursor-pointer"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <span>{item.name}</span>
                  <span
                    className={`size-4 transition-transform duration-300 ${
                      expandedItems.has(item.id) ? "rotate-180" : ""
                    }`}
                  >
                    {ChevronDownIcon}
                  </span>
                </div>
                {expandedItems.has(item.id) && (
                  <div className="ml-4 border-l border-gray-200 mb-6">
                    {item.children.map((child) => (
                      <div
                        key={child.id}
                        onClick={() =>
                          handleNavigation(child.url, child.metadata)
                        }
                        className="block py-3 pl-4 hover:text-[var(--color-primary-500)] transition-all duration-300 ease-in-out cursor-pointer text-sm"
                      >
                        {child.name}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                onClick={() => handleNavigation(item.url, item.metadata)}
                className={`block pb-4 hover:text-[var(--color-primary-500)] transition-all duration-300 ease-in-out cursor-pointer ${
                  (pathName === "/contact" && item.name === "Contact") ||
                  (pathName === "/frequently-asked-questions" &&
                    item.name === "FAQ")
                    ? "text-[var(--color-primary-500)]"
                    : ""
                }`}
              >
                {item.name}
              </div>
            )}
          </div>
        ))}

        {/* Find A Dealer Button */}
        <div className="mt-6 pt-6 border-t border-gray-400">
          <PrimaryButton
            className="w-full text-base"
            content="WHERE TO BUY"
            onClick={() => handleNavigation("/locator")}
          />
        </div>
      </div>
    </div>
  );
};

export default HamMenuSlide;
