"use client";

import { useState, useEffect } from "react";
import { Service } from "@/models/service";
import { Category } from "@/models/category";

export const useServices = () => {
  const [services, setServices] = useState<Service[]>(globalServicesCache || []);
  const [categories, setCategories] = useState<Category[]>(globalCategoriesCache || []);
  const [loading, setLoading] = useState(!globalServicesCache || !globalCategoriesCache);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // If we have data in cache, use it immediately and ensure loading is false
      if (globalServicesCache && globalCategoriesCache) {
        setServices(globalServicesCache);
        setCategories(globalCategoriesCache);
        setLoading(false);
        return;
      }

      // If a fetch is already in progress, wait for it
      if (globalFetchPromise) {
        if (!loading) setLoading(true); // Only set loading if not already (though initial state handles this)
        await globalFetchPromise;
        setServices(globalServicesCache!);
        setCategories(globalCategoriesCache!);
        setLoading(false);
        return;
      }

      setLoading(true);
      globalFetchPromise = Promise.all([
        fetch("/api/services").then((res) => res.json()),
        fetch("/api/categories").then((res) => res.json()),
      ]);

      const [servicesRes, categoriesRes] = await globalFetchPromise;

      const servicesData = servicesRes || [];
      const categoriesData = categoriesRes || [];

      // Transform services to match Service type
      const transformedServices: Service[] = servicesData.map((s: any) => ({
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
      const transformedCategories: Category[] = categoriesData.map((c: any) => ({
        _id: c.id,
        name: c.name,
      }));

      globalServicesCache = transformedServices;
      globalCategoriesCache = transformedCategories;

      setServices(transformedServices);
      setCategories(transformedCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      globalFetchPromise = null; // Reset promise on error so we can try again
    } finally {
      if (!globalServicesCache) { // Only set loading false if we failed or finished, if we succeeded we did it above
        setLoading(false);
      }
      // If successful, loading was set to false above. 
      // Actually strictly speaking we should unsure loading is false here too but let's be safe.
      setLoading(false);
      globalFetchPromise = null;
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
    refetch: async () => {
      globalServicesCache = null;
      globalCategoriesCache = null;
      globalFetchPromise = null;
      await fetchData();
    },
  };
};

// Global cache variables
let globalServicesCache: Service[] | null = null;
let globalCategoriesCache: Category[] | null = null;
let globalFetchPromise: Promise<[any, any]> | null = null;
