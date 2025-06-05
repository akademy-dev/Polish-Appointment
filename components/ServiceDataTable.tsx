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
import { Circle, Loader2, Pencil, Trash2 } from "lucide-react";
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
import { client } from "@/sanity/lib/client";
import {
  CATEGORIES_QUERY,
  SERVICES_QUERY,
  TOTAL_SERVICES_QUERY,
} from "@/sanity/lib/queries";
import { Service } from "@/models/service";
import FormButton from "@/components/FormButton";

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
    cell: ({ row }) => formatDuration(row.getValue("duration") as number),
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
          <FormButton
            mode="delete"
            type="services"
            variant="default"
            size="icon"
            service={row.original}
            className="bg-red-500 hover:bg-red-400"
          >
            <Trash2 className="size-5" aria-hidden="true" />
          </FormButton>
        </div>
      );
    },
  },
];

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0min";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}min`;
  }
  if (remainingMinutes === 0) {
    return `${hours}hr`;
  }
  return `${hours}hr ${remainingMinutes}min`;
}

export function ServiceDataTable() {
  const [data, setData] = React.useState<Service[]>([]);
  const [categories, setCategories] = React.useState<
    { _id: string; name: string }[]
  >([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(7);
  const [categoryId, setCategoryId] = React.useState("");
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSpinner, setShowSpinner] = React.useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const MIN_LOADING_DURATION = 200; // Ngưỡng thời gian tối thiểu để hiển thị spinner (ms)

  const params = {
    page,
    limit,
    categoryId,
    searchTerm: debouncedSearch,
  };

  // Lấy tất cả category khi component mount
  React.useEffect(() => {
    async function fetchCategories() {
      try {
        const result = await client.fetch(CATEGORIES_QUERY);
        setCategories(result || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }

    fetchCategories();
  }, []);

  async function fetchData() {
    const startTime = Date.now();
    setIsLoading(true);
    try {
      const [result, totalResult] = await Promise.all([
        client.fetch(SERVICES_QUERY, params),
        client.fetch(TOTAL_SERVICES_QUERY, {
          categoryId: params.categoryId,
          searchTerm: params.searchTerm,
        }),
      ]);

      // Chỉ hiển thị spinner nếu thời gian tải vượt ngưỡng
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime >= MIN_LOADING_DURATION) {
        setShowSpinner(true);
      }

      setData(result || []);
      setTotal(totalResult || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      // Đảm bảo spinner hiển thị ít nhất MIN_LOADING_DURATION để tránh nhấp nháy
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOADING_DURATION - elapsedTime;
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
      setIsLoading(false);
      setShowSpinner(false);
    }
  }

  React.useEffect(() => {
    fetchData();
  }, [page, limit, categoryId, debouncedSearch]);

  const table = useReactTable({
    data,
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
            setSearch(event.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <select
          className="border rounded px-2 py-1"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          disabled={isLoading}
        >
          <option value="">All Groups</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-md border relative">
        {showSpinner && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 animate-in fade-in duration-200 z-10">
            <div className="flex items-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          </div>
        )}
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
                          header.getContext()
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
                  className={showSpinner ? "opacity-50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1 || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="default"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
