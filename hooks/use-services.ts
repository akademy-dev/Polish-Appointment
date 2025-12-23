"use client";

import { useState, useEffect } from "react";
import { Service } from "@/models/service";
import { Category } from "@/models/category";

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
      try {
        setLoading(true);
      const [servicesRes, categoriesRes] = await Promise.all([
        fetch("/api/services").then((res) => res.json()),
        fetch("/api/categories").then((res) => res.json()),
        ]);

      const servicesData = servicesRes || [];
      const categoriesData = categoriesRes || [];

      // Transform services to match Service type
      const transformedServices: Service[] = servicesData.map((s) => ({
        _id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
        category: s.category
          ? {
              _id: s.category.id,
              name: s.category.name,
            }
          : {
              _id: "",
              name: "",
            },
      }));

      // Transform categories to match Category type
      const transformedCategories: Category[] = categoriesData.map((c) => ({
        _id: c.id,
        name: c.name,
      }));

      setServices(transformedServices);
      setCategories(transformedCategories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    services,
    categories,
    loading,
    error,
    refetch: fetchData,
  };
};
