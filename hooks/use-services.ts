"use client";

import { useState, useEffect } from "react";
import { client } from "@/sanity/lib/client";
import { ALL_SERVICES_QUERY, CATEGORIES_QUERY } from "@/sanity/lib/queries";
import { Service } from "@/models/service";
import { Category } from "@/models/category";

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesData, categoriesData] = await Promise.all([
          client.fetch(ALL_SERVICES_QUERY),
          client.fetch(CATEGORIES_QUERY),
        ]);

        setServices(servicesData || []);
        setCategories(categoriesData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    services,
    categories,
    loading,
    error,
    refetch: () => {
      setError(null);
      setLoading(true);
      // Re-run the fetch logic
    },
  };
};
