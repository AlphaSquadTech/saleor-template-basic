"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import StoreLocator from "./components/storeLocator";
import Breadcrumb from "../components/reuseableUI/breadcrumb";
import OnlineDealers from "./components/onlineDealers";
import Distributors from "./components/distributors";

const locatorBreadcrumbItems = [
  { text: "HOME", link: "/" },
  { text: "STORE LOCATOR" },
];

const Page = () => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("store");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "distributors" ||
      tabParam === "online" ||
      tabParam === "store"
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs = [
    { id: "store", label: "Store Locator" },
    { id: "online", label: "Online Dealers" },
    { id: "distributors", label: "Distributors" },
  ];

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 md:py-16 lg:py-24 lg:px-0 relative space-y-6">
      <Breadcrumb items={locatorBreadcrumbItems} />

      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[var(--color-secondary-800)]">
        Store Locator
      </h2>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 lg:space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.history.replaceState(null, "", `?tab=${tab.id}`);
              }}
              className={`
                py-4 px-1 border-b-2 font-primary cursor-pointer font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? "border-[var(--color-secondary-800)] text-[var(--color-secondary-800)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "store" && <StoreLocator />}
        {activeTab === "online" && <OnlineDealers />}
        {activeTab === "distributors" && <Distributors />}
      </div>
    </div>
  );
};

export default Page;
