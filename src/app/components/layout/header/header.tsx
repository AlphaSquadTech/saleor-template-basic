import { Suspense } from "react";
import { NavBar } from "./navBar";
import TopBar from "./topBar";
import { fetchCategories, fetchMenuData } from "./utils/serverNavbarData";


export const Header = async () => {
  const [categories, menuItems] = await Promise.allSettled([
    fetchCategories(),
    fetchMenuData()
  ]);

  const categoriesData = categories.status === 'fulfilled' ? categories.value : [];
  const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : [];

  return (
    <header className="w-full">
      <Suspense
        fallback={
          <div
            className="w-full"
            style={{ backgroundColor: "var(--color-secondary-900)", height: 36 }}
          />
        }
      >
        {/* Contact + Timings Banner */}
        <TopBar />
      </Suspense>
      <Suspense
        fallback={
          <div
            className="w-full"
            style={{ backgroundColor: "var(--color-secondary-900)", height: 72 }}
          />
        }
      >
        <NavBar categories={categoriesData} menuItems={menuItemsData} />
      </Suspense>
    </header>
  );
};
