"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";

export interface Category {
  _id: string;
  id: string;
  name: string;
}

interface CategoriesContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined
);

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
};

interface CategoriesProviderProps {
  children: ReactNode;
}

export const CategoriesProvider = ({ children }: CategoriesProviderProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      if (globalCategoriesCache) {
        setCategories(globalCategoriesCache);
        setLoading(false);
        return;
      }

      if (globalCategoriesPromise) {
        setLoading(true);
        const result = await globalCategoriesPromise;
        const transformedCategories = (result || []).map((cat: any) => ({
          _id: cat.id,
          id: cat.id,
          name: cat.name,
        }));
        setCategories(transformedCategories);
        return;
      }

      setLoading(true);
      setError(null);

      globalCategoriesPromise = fetch("/api/categories").then(res => {
        if (!res.ok) throw new Error("Failed to fetch categories");
        return res.json();
      });

      const result = await globalCategoriesPromise;
      // Transform to match expected format
      const transformedCategories = (result || []).map((cat: any) => ({
        _id: cat.id,
        id: cat.id,
        name: cat.name,
      }));

      globalCategoriesCache = transformedCategories;
      setCategories(transformedCategories);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories"
      );
      globalCategoriesPromise = null; // Reset promise on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const refetch = () => {
    globalCategoriesCache = null;
    globalCategoriesPromise = null;
    fetchCategories();
  };

  return (
    <CategoriesContext.Provider value={{ categories, loading, error, refetch }}>
      {children}
    </CategoriesContext.Provider>
  );
};

// Global cache variables
let globalCategoriesCache: Category[] | null = null;
let globalCategoriesPromise: Promise<any> | null = null;
