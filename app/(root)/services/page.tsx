import React from "react";
import { Suspense } from "react";
import { ServiceDataTable } from "@/components/ServiceDataTable";
import { CATEGORIES_QUERY, SERVICES_QUERY } from "@/sanity/lib/queries";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    id?: string;
    query?: string;
  }>;
}

const page = async ({ searchParams }: PageProps) => {
  // Await searchParams to access its properties
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const categoryId = resolvedSearchParams.id || "";
  const searchTerm = resolvedSearchParams.query || "";
  const limit = 7;

  const [services, categories] = await Promise.all([
    sanityFetch({
      query: SERVICES_QUERY,
      params: {
        page,
        limit,
        categoryId,
        searchTerm,
      },
    }),
    sanityFetch({
      query: CATEGORIES_QUERY,
    }),
  ]);

  return (
    <>
      <h2 className="heading">Services</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <ServiceDataTable
          initialServices={services.data.data || []}
          categories={categories?.data || []}
          total={services.data.total || 0}
          initialParams={{
            page,
            categoryId,
            searchTerm,
            limit,
          }}
        />
      </Suspense>
      <SanityLive />
    </>
  );
};

export default page;
