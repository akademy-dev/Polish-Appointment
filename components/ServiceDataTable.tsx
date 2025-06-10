"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Circle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Service } from "@/models/service";
import FormButton from "@/components/FormButton";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMinuteDuration } from "@/lib/utils";

// Hook debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: "category.name",
    header: "Group",
    enableSorting: true,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const showOnline = row.original.showOnline;
      return (
        <div className="flex items-center gap-2">
          <Circle
            color={showOnline ? "#28C840" : "#FF5F57"}
            size={12}
            fill={showOnline ? "#28C840" : "#FF5F57"}
          />
          <span className="font-medium">{row.getValue("name") as string}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("price");
      return typeof price === "number" ? `$${price.toFixed(2)}` : "-";
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => formatMinuteDuration(row.getValue("duration") as number),
  },
  {
    accessorKey: "action",
    header: "",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <FormButton
            mode="edit"
            type="services"
            variant="default"
            size="icon"
            service={row.original}
          >
            <Pencil className="size-5" aria-hidden="true" />
          </FormButton>
        </div>
      );
    },
  },
];

interface ServiceDataTableProps {
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

export function ServiceDataTable({
  initialServices,
  categories,
  total,
  initialParams,
}: ServiceDataTableProps) {
  const [data, setData] = React.useState<Service[]>(initialServices);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Memoize data to prevent unnecessary re-renders
  const memoizedData = React.useMemo(() => data, [data]);

  // Sync data with initialServices when props change
  React.useEffect(() => {
    setData(initialServices);
  }, [initialServices]);

  // Lấy searchParams và router từ Next.js
  const searchParams = useSearchParams();
  const router = useRouter();

  // Khởi tạo state từ initialParams
  const [search, setSearch] = React.useState(initialParams.searchTerm);
  const [page, setPage] = React.useState(initialParams.page);
  const [categoryId, setCategoryId] = React.useState(initialParams.categoryId);
  const [limit] = React.useState(initialParams.limit);

  const debouncedSearch = useDebounce(search, 300);

  // Hàm cập nhật URL query parameters
  const updateQueryParams = (newParams: {
    page?: number;
    id?: string;
    query?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const newPage = newParams.page ?? page;
    const newId = newParams.id ?? categoryId;
    const newQuery = newParams.query ?? debouncedSearch;

    // Only navigate if params have changed
    if (
      newPage.toString() === searchParams.get("page") &&
      newId === searchParams.get("id") &&
      newQuery === searchParams.get("query")
    ) {
      return;
    }

    if (newParams.page) {
      params.set("page", newParams.page.toString());
    }
    if (newParams.id !== undefined) {
      if (newParams.id) {
        params.set("id", newParams.id);
      } else {
        params.delete("id");
      }
    }
    if (newParams.query !== undefined) {
      if (newParams.query) {
        params.set("query", newParams.query);
      } else {
        params.delete("query");
      }
    }
    const newUrl = `/services?${params.toString()}`;
    console.log("ServiceDataTable - Navigating to:", newUrl);
    router.replace(newUrl, { scroll: false });
  };

  // Đồng bộ state với debouncedSearch
  React.useEffect(() => {
    const currentQuery = searchParams.get("query") || "";
    if (debouncedSearch !== currentQuery) {
      console.log("ServiceDataTable - Search changed:", debouncedSearch);
      updateQueryParams({ query: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, searchParams]);

  const table = useReactTable({
    data: memoizedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4 gap-2 w-full">
        <Input
          placeholder="Search by service name..."
          value={search}
          onChange={(event) => {
            const newSearch = event.target.value;
            setSearch(newSearch);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <select
          className="border rounded px-2 py-1"
          value={categoryId}
          onChange={(e) => {
            const newCategoryId = e.target.value;
            setCategoryId(newCategoryId);
            setPage(1);
            console.log("ServiceDataTable - Category changed:", newCategoryId);
            updateQueryParams({ id: newCategoryId, page: 1 });
          }}
        >
          <option value="">All Groups</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <span className="text-sm text-muted-foreground mr-4">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="default"
          onClick={() => {
            const newPage = Math.max(1, page - 1);
            setPage(newPage);
            console.log("ServiceDataTable - Page changed:", newPage);
            updateQueryParams({ page: newPage });
          }}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="default"
          onClick={() => {
            const newPage = Math.min(totalPages, page + 1);
            setPage(newPage);
            console.log("ServiceDataTable - Page changed:", newPage);
            updateQueryParams({ page: newPage });
          }}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
