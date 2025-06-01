"use client";

import { X } from "lucide-react";
import Link from "next/link";

const SearchFormReset = ({ action }: { action: string }) => {
  const reset = () => {
    const form = document.querySelector(".search-form") as HTMLFormElement;

    if (form) {
      form.reset();
    }
  };
  return (
    <button type="reset" onClick={reset}>
      <Link href={action}>
        <X className="size-5" />
      </Link>
    </button>
  );
};

export default SearchFormReset;
