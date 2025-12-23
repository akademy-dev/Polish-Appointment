"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import SearchFormReset from "./SearchFormReset";
import { useSearchParams, useRouter } from "next/navigation";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const SearchForm = ({ action }: { action?: string }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("query") || "";
  const [searchValue, setSearchValue] = useState(query);
  const debouncedSearch = useDebounce(searchValue, 200); // 200ms debounce
  const isInitialMount = useRef(true);
  const isUpdatingFromDebounce = useRef(false);

  // Update URL when debounced search changes (from user typing)
  useEffect(() => {
    // Skip on initial mount to avoid unnecessary navigation
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentQuery = searchParams.get("query") || "";
    if (debouncedSearch !== currentQuery) {
      isUpdatingFromDebounce.current = true;
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedSearch.trim()) {
        params.set("query", debouncedSearch.trim());
        // Reset to page 1 when searching
        params.set("page", "1");
      } else {
        params.delete("query");
        params.set("page", "1");
      }
      const newUrl = `${action || "/"}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [debouncedSearch, action, router, searchParams]);

  // Sync searchValue with URL query param when it changes externally (e.g., reset button)
  useEffect(() => {
    // Don't sync if we just updated from debounce
    if (isUpdatingFromDebounce.current) {
      isUpdatingFromDebounce.current = false;
      return;
    }

    const urlQuery = searchParams.get("query") || "";
    if (urlQuery !== searchValue) {
      setSearchValue(urlQuery);
      isInitialMount.current = true; // Reset flag when URL changes externally
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediately update URL on submit (Enter or click icon)
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue.trim()) {
      params.set("query", searchValue.trim());
      params.set("page", "1");
    } else {
      params.delete("query");
      params.set("page", "1");
    }
    const newUrl = `${action || "/"}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <Input
        className="search-input"
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search"
        startAdornment={
          <button type="submit">
            <Search className="size-5 text-black" />
          </button>
        }
        endAdornment={query && action && <SearchFormReset action={action} />}
      />
    </form>
  );
};

export default SearchForm;
