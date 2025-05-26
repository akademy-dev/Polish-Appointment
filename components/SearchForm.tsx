import React from "react";
import Form from "next/form";
import { Search } from "lucide-react";
import { Input } from "./ui/input";

const SearchForm = ({ query }: { query?: string }) => {
  return (
    <Form action="" scroll={false} className="search-form">
      <Input
        type="text"
        name="query"
        defaultValue={query}
        placeholder="Search"
        startAdornment={
          <button type="submit">
            <Search className="size-5 text-black" />
          </button>
        }
      />
    </Form>
  );
};

export default SearchForm;
