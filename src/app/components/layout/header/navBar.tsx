"use client";

import { useMemo } from "react";
import Link from "next/link";
import HamMenuSlide from "./hamMenuSlide";
import { MobileNavbar } from "./components/MobileNavbar";
import { NavbarBrand } from "./components/NavbarBrand";
import { NavigationLinks } from "./components/NavigationLinks";
import { useNavbarState } from "./hooks/useNavbarState";
import { navbarStyles } from "./styles/navbarStyles";
import type { CategoryNode, MenuItem } from "./utils/serverNavbarData";
import Search from "./search";
import PrimaryButton from "@/app/components/reuseableUI/primaryButton";

interface NavBarProps {
  categories: CategoryNode[];
  menuItems: MenuItem[];
}

export const NavBar = ({ 
  categories,
  menuItems 
}: NavBarProps) => {
  const {
    isHamMenuOpen,
    setIsHamMenuOpen,
    isEnableSearch,
    isActive,
    toggleHamMenu,
    toggleSearch
  } = useNavbarState();

  // Memoized brand configuration
  const brandConfig = useMemo(() => {
    const brandName =
      process.env.NEXT_PUBLIC_BRAND_NAME ||
      process.env.NEXT_PUBLIC_TENANT_NAME ||
      "Saleor Storefront";
    const logo =
      process.env.NEXT_PUBLIC_LOGO_URL ||
      "https://webshopmanager.com/files/images/logo.png";
    return { brandName, logo };
  }, []);

  return (
    <>
      <MobileNavbar 
        {...brandConfig}
        isEnableSearch={isEnableSearch}
        toggleSearch={toggleSearch}
        isHamMenuOpen={isHamMenuOpen}
        toggleHamMenu={toggleHamMenu}
      />

      {/* Desktop Menu */}
      <nav className={navbarStyles.desktopContainer}>
        <div className={navbarStyles.linksContainer}>
          <NavbarBrand {...brandConfig} />
          <NavigationLinks
            categories={categories}
            categoriesLoading={false}
            menuItems={menuItems}
            isActive={isActive}
          />
        </div>

        <div className={navbarStyles.actionsContainer}>
          <div className="flex w-full items-center justify-end">
            <Search />
          </div>
          <Link href="/locator" className="shrink-0">
            <PrimaryButton
              className="text-base text-black whitespace-nowrap"
              content="WHERE TO BUY"
            />
          </Link>
        </div>
      </nav>
      
      <HamMenuSlide
        isHamMenuOpen={isHamMenuOpen}
        setIsHamMenuOpen={setIsHamMenuOpen}
        menuItems={menuItems}
      />
    </>
  );
};
