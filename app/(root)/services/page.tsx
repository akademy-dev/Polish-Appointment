import React from "react";
import { getServices } from "@/data/service";
import { getCategories } from "@/data/category";
import ServicesPageClient from "@/components/ServicesPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
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
  const limit = parseInt(resolvedSearchParams.limit || "20", 10);

  const [servicesResponse, categories] = await Promise.all([
    getServices({
      page,
      limit,
      categoryId,
      searchTerm,
    }),
    getCategories(),
  ]);

  // Transform categories to match expected format
  const categoriesFormatted = categories.map((cat) => ({
    _id: cat.id,
    id: cat.id,
    name: cat.name,
  }));

  return (
    <ServicesPageClient
      initialServices={servicesResponse.data || []}
      categories={categoriesFormatted}
      total={servicesResponse.total || 0}
      initialParams={{
        page,
        categoryId,
        searchTerm,
        limit,
      }}
    />
  );
};

export default page;
