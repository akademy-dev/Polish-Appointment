"use client";

import * as React from "react";
import {
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
import { Circle, Pencil, Trash2 } from "lucide-react";
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
import ConfirmDialog from "@/components/ConfirmDialog";
import { useState } from "react";
import { columns } from "@/components/DataTable";
import { deleteService } from "@/lib/actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // Sync data with initialServices when props change
  React.useEffect(() => {
    setData(initialServices);
    setLoading(false);
  }, [initialServices]);

  // Lấy searchParams và router từ Next.js
  const searchParams = useSearchParams();
  const router = useRouter();

  // Khởi tạo state từ initialParams
  const [search, setSearch] = React.useState(initialParams.searchTerm);
  const [page, setPage] = React.useState(initialParams.page);
  const [categoryId, setCategoryId] = React.useState(initialParams.categoryId);
  const [limit, setLimit] = React.useState(initialParams.limit);
  const [loading, setLoading] = React.useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Hàm cập nhật URL query parameters
  const updateQueryParams = (newParams: {
    page?: number;
    id?: string;
    query?: string;
    limit?: number;
  }) => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    const newPage = newParams.page ?? page;
    const newId = newParams.id ?? categoryId;
    const newQuery = newParams.query ?? debouncedSearch;
    const newLimit = newParams.limit ?? limit;

    // Only navigate if params have changed
    if (
      newPage.toString() === searchParams.get("page") &&
      newId === searchParams.get("id") &&
      newQuery === searchParams.get("query") &&
      newLimit === parseInt(searchParams.get("limit") || "20", 10)
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
    if (newParams.limit !== undefined) {
      params.set("limit", newParams.limit.toString());
    }
    const newUrl = `/services?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  // Đồng bộ state với debouncedSearch
  React.useEffect(() => {
    const currentQuery = searchParams.get("query") || "";
    if (debouncedSearch !== currentQuery) {
      updateQueryParams({ query: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, searchParams]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [id, setId] = useState<string>("");
  const handleConfirm = async () => {
    setShowConfirm(false);
    await handleAppointmentSuccess(); // your update logic
  };

  const handleAppointmentSuccess = async () => {
    // try catch delete service
    try {
      const result = await deleteService(id);

      if (result.status == "SUCCESS") {
        toast.success("Success", {
          description: "Service deleted successfully.",
        });
      } else {
        toast.error("Error", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to delete service. Please try again.",
      });
    }
  };

  const table = useReactTable({
    data: data,
    columns: [
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
              <span className="font-medium">
                {row.getValue("name") as string}
              </span>
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
        cell: ({ row }) =>
          formatMinuteDuration(row.getValue("duration") as number),
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
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  // Open confirmation dialog
                  setShowConfirm(true);
                  setId(row.original._id);
                }}
              >
                <Trash2 className="size-5" aria-hidden="true" />
              </Button>
            </div>
          );
        },
      },
    ],
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

  const totalPages = React.useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit],
  );

  React.useEffect(() => {
    table.setPageSize(limit);
  }, [limit, table]);

  return (
    <>
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
          <div className="flex gap-2">
            <select
              className="border rounded px-2 py-1"
              value={categoryId}
              onChange={(e) => {
                const newCategoryId = e.target.value;
                setCategoryId(newCategoryId);
                setPage(1);
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  const newLimit = parseInt(value, 10);
                  setLimit(newLimit);
                  setPage(1); // Reset to first page when limit changes
                  updateQueryParams({ limit: newLimit, page: 1 });
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div
          className={`rounded-md border transition-opacity ${loading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <Table className="table-fixed w-full">
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
          </Table>
          <div className="max-h-[400px] overflow-y-auto">
            <Table className="table-fixed w-full">
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
        </div>
        <div className="flex items-center justify-end space-x-2 py-3">
          <span className="text-sm text-muted-foreground mr-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="default"
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              setPage(newPage);
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
              updateQueryParams({ page: newPage });
            }}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete Service"
        description="Are you sure you want to delete this service? The appointments associated with this service will also be deleted. This action cannot be undone."
        onConfirm={handleConfirm}
      />
    </>
  );
}
