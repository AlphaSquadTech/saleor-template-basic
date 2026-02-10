import React from "react";
import { useQuery } from "@apollo/client";
import {
  GET_ONLINE_DEALERS,
  OnlineDealersData,
} from "@/graphql/queries/onlineDealers";
import OnlineDealersRenderer from "./onlineDealersRenderer";

const OnlineDealers = () => {
  const { loading, error, data } =
    useQuery<OnlineDealersData>(GET_ONLINE_DEALERS);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="animate-spin rounded-full size-12 border-b-2 border-[var(--color-secondary-800)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-medium">Error loading online dealers</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const pageContent = data?.pages?.edges?.[0]?.node?.content;

  if (!pageContent) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
        <p>No online dealers information available.</p>
      </div>
    );
  }

  return <OnlineDealersRenderer content={pageContent} />;
};

export default OnlineDealers;
