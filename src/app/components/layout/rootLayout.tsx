import React from "react";
import Footer from "./footer";
import { Header } from "./header/header";
import { YMMBarWrapper } from "../reuseableUI/ymmBarWrapper";

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <div>
      {/* Sticky Header */}
      <div className="sticky top-0 z-20">
        <Header />
      </div>

      {/* YMM Search Bar */}
      <YMMBarWrapper />

      {/* Main Content */}
      <main>{children}</main>
      <Footer />
    </div>
  );
}
