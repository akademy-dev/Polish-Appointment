"use client";

import React from "react";
import { ServiceDataTable } from "@/components/ServiceDataTable";
import { Service } from "@/models/service";
import { CategoriesProvider } from "@/hooks/use-categories";
import CreateInfoButton from "@/components/CreateInfoButton";

interface ServicesPageClientProps {
  initialServices: Service[];
  categories: { _id: string; name: string }[];
  total: number;
  initialParams: {
    page: number;
    categoryId: string;
    searchTerm: string;
    limit: number;
  };
}

const ServicesPageClient = ({
  initialServices,
  categories,
  total,
  initialParams,
}: ServicesPageClientProps) => {
  return (
    <CategoriesProvider>
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading">Services</h2>
        <CreateInfoButton type="services" categories={categories} />
      </div>
      <ServiceDataTable
        initialServices={initialServices}
        categories={categories}
        total={total}
        initialParams={initialParams}
      />
    </CategoriesProvider>
  );
};

export default ServicesPageClient;

