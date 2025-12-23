"use client";

import { X } from "lucide-react";
import Link from "next/link";

const SearchFormReset = ({ action }: { action: string }) => {
  return (
    <Link href={action}>
      <button type="button">
        <X className="size-5" />
      </button>
    </Link>
  );
};

export default SearchFormReset;
