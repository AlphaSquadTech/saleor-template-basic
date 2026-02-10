import Link from "next/link";
import { ChevronDownIcon } from "@/app/utils/svgs/chevronDownIcon";
import { useDropdown } from "../hooks/useDropdown";
import { navbarStyles } from "../styles/navbarStyles";
import type { MenuItem } from "../utils/serverNavbarData";

interface MenuItemDropdownProps {
  item: MenuItem;
  isActive: (href: string) => boolean;
}

export const MenuItemDropdown = ({ item, isActive }: MenuItemDropdownProps) => {
  const { isOpen, handleMouseEnter, handleMouseLeave } = useDropdown(50);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={item.url}
        className={`${navbarStyles.navLinkBase} ${
          isActive(item.url)
            ? navbarStyles.navLinkActive
            : navbarStyles.navLinkInactive
        } whitespace-nowrap`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex items-center  gap-2 transition-all ease-in-out duration-300">
          <span>{item.name}</span>
          <span
            className={`size-4 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            {ChevronDownIcon}
          </span>
        </div>
      </Link>

      {isOpen && (
        <div
          className={navbarStyles.dropdown.container}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="menu"
          aria-label={`${item.name} submenu`}
        >
          {item.children?.map((child) => (
            <Link
              key={child.id}
              href={child.url}
              className={navbarStyles.dropdown.item}
              role="menuitem"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};