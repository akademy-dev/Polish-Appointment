"use client";

import React from "react";
import Form from "next/form";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import SearchFormReset from "./SearchFormReset";
import { useSearchParams } from "next/navigation";

const SearchForm = ({ action }: { action?: string }) => {
  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  return (
    <Form action={action || "/"} scroll={false} className="search-form">
      <Input
        key={query || "empty"}
        className="search-input"
        type="text"
        name="query"
        defaultValue={query || ""}
        placeholder="Search"
        startAdornment={
          <button type="submit">
            <Search className="size-5 text-black" />
          </button>
        }
        endAdornment={query && action && <SearchFormReset action={action} />}
      />
    </Form>
  );
};

export default SearchForm;
