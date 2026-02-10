import { Suspense } from "react";
import { SearchIcon } from "@/app/utils/svgs/searchIcon";
import { CrossIcon } from "@/app/utils/svgs/crossIcon";
import { MenuIcon } from "@/app/utils/svgs/menuIcon";
import Search from "../search";
import { NavbarBrand } from "./NavbarBrand";
import { navbarStyles } from "../styles/navbarStyles";

interface MobileNavbarProps {
  isEnableSearch: boolean;
  toggleSearch: () => void;
  isHamMenuOpen: boolean;
  toggleHamMenu: () => void;
  logo: string;
  brandName: string;
}

export const MobileNavbar = ({
  isEnableSearch,
  toggleSearch,
  isHamMenuOpen,
  toggleHamMenu,
  logo,
  brandName,
}: MobileNavbarProps) => {
  return (
    <div className={navbarStyles.mobileContainer}>
      {isEnableSearch ? (
        <div className="flex items-center w-full gap-2">
          <Suspense
            fallback={
              <div className="h-11 w-full bg-[var(--color-secondary-800)] animate-pulse rounded" />
            }
          >
            <Search className="w-full max-w-none" />
          </Suspense>
          <button
            onClick={toggleSearch}
            className="p-2.5 cursor-pointer text-white [&>svg]:size-5"
            aria-label="Close search"
          >
            {CrossIcon}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleHamMenu}
              className="[&>svg]:size-5 py-2.5 text-white cursor-pointer"
              aria-label={isHamMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isHamMenuOpen}
            >
              {isHamMenuOpen ? CrossIcon : MenuIcon}
            </button>
            <NavbarBrand
              logo={logo}
              brandName={brandName}
              width={107}
              height={32}
            />
          </div>

          <div className="flex w-fit items-center gap-4">
            <button
              onClick={toggleSearch}
              className="text-white py-2.5 hover:text-[var(--color-primary-500)] cursor-pointer transition-all ease-in-out duration-300"
              aria-label="Open search"
            >
              {SearchIcon}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
