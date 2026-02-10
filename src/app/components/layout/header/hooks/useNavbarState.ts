import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

export const useNavbarState = () => {
  const [isHamMenuOpen, setIsHamMenuOpen] = useState(() => false);
  const [isEnableSearch, setIsEnableSearch] = useState(() => false);
  const pathName = usePathname();

  // Close mobile overlays on route change.
  useEffect(() => {
    setIsHamMenuOpen(false);
    setIsEnableSearch(false);
  }, [pathName]);

  const isActive = useCallback((href: string) => 
    pathName === href || pathName.startsWith(`${href}/`),
    [pathName]
  );

  const toggleHamMenu = useCallback(() => {
    // Add protection against rapid toggling from extensions
    setIsHamMenuOpen((prev) => {
      // Ensure we always get a clean boolean value
      const currentState = Boolean(prev);
      return !currentState;
    });
  }, []);

  const toggleSearch = useCallback(() => {
    setIsEnableSearch((prev) => {
      // Ensure we always get a clean boolean value  
      const currentState = Boolean(prev);
      return !currentState;
    });
  }, []);

  return {
    isHamMenuOpen,
    setIsHamMenuOpen,
    isEnableSearch,
    setIsEnableSearch,
    pathName,
    isActive,
    toggleHamMenu,
    toggleSearch
  };
};
