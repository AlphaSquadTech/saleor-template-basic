import React from "react";
import { DynamicPageData } from "@/graphql/queries/getDynamicPageBySlug";
import ServerHtmlRenderer from "./ServerHtmlRenderer";

interface DynamicPageRendererProps {
  pageData: DynamicPageData;
}

export default function DynamicPageRenderer({
  pageData,
}: DynamicPageRendererProps) {
  return <ServerHtmlRenderer html={pageData.content || ""} />;
}
