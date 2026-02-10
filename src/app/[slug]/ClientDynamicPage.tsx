'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import DynamicPageRenderer from '../components/dynamicPage/DynamicPageRenderer';
import { DynamicPageData } from '@/graphql/queries/getDynamicPageBySlug';

interface ClientDynamicPageProps {
  slug: string;
}

export default function ClientDynamicPage({ slug }: ClientDynamicPageProps) {
  const [pageData, setPageData] = useState<DynamicPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    async function fetchPageData() {
      try {
        const response = await fetch(`/api/dynamic-page/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setIsMissing(true);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setPageData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page');
      } finally {
        setLoading(false);
      }
    }

    fetchPageData();
  }, [slug]);

  if (isMissing) {
    notFound(); 
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading page...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Page</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!pageData) {
    notFound();
    return null;
  }

  return (
    <main className="min-h-screen">
      <DynamicPageRenderer pageData={pageData} />
    </main>
  );
}