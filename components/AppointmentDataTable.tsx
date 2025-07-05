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
  ColumnDef,
  ColumnMeta, // Import ColumnMeta
} from "@tanstack/react-table";
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
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Appointment } from "@/models/appointment";
import { format } from "date-fns";

// Define a custom meta interface to include className
interface CustomColumnMeta<TData, TValue> extends ColumnMeta<TData, TValue> {
  className?: string;
}

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

interface AppointmentDataTableProps {
  initialAppointments: Appointment[];
  total: number;
  initialParams: {
    page: number;
    status: string;
    searchTerm: string;
    limit: number;
  };
}

export function AppointmentDataTable({
  initialAppointments,
  total,
  initialParams,
}: AppointmentDataTableProps) {
  const [data, setData] = React.useState<Appointment[]>(initialAppointments);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Sync data with initialAppointments when props change
  React.useEffect(() => {
    setData(initialAppointments);
    setLoading(false);
  }, [initialAppointments]);

  // Lấy searchParams và router từ Next.js
  const searchParams = useSearchParams();
  const router = useRouter();

  // Khởi tạo state từ initialParams
  const [search, setSearch] = React.useState(initialParams.searchTerm);
  const [page, setPage] = React.useState(initialParams.page);
  const [status, setStatus] = React.useState(initialParams.status);
  const [limit, setLimit] = React.useState(initialParams.limit);
  const [loading, setLoading] = React.useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Hàm cập nhật URL query parameters
  const updateQueryParams = (newParams: {
    page?: number;
    status?: string;
    query?: string;
    limit?: number;
  }) => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    const newPage = newParams.page ?? page;
    const newStatus = newParams.status ?? status;
    const newQuery = newParams.query ?? debouncedSearch;
    const newLimit = newParams.limit ?? limit;

    // Only navigate if params have changed
    if (
      newPage.toString() === searchParams.get("page") &&
      newStatus === searchParams.get("status") &&
      newQuery === searchParams.get("query") &&
      newLimit === parseInt(searchParams.get("limit") || "20", 10)
    ) {
      return;
    }
    if (newParams.page) {
      params.set("page", newParams.page.toString());
    }
    if (newParams.status !== undefined) {
      if (newParams.status) {
        params.set("status", newParams.status);
      } else {
        params.delete("status");
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
    const newUrl = `/appointments?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  // Đồng bộ state với debouncedSearch
  React.useEffect(() => {
    const currentQuery = searchParams.get("query") || "";
    if (debouncedSearch !== currentQuery) {
      updateQueryParams({ query: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, searchParams]);

  const table = useReactTable({
    data: data,
    columns: [
      {
        accessorKey: "customer.fullName",
        header: "Customer",
      },
      {
        accessorKey: "employee.fullName",
        header: "Employee",
      },
      {
        accessorKey: "service.name",
        header: "Service",
      },
      {
        accessorKey: "startTime",
        header: "Start Time",
        cell: ({ row }: { row: { original: Appointment } }) => (
          <div>
            {format(new Date(row.original.startTime), "dd/MM/yyyy HH:mm")}
          </div>
        ),
      },
      {
        accessorKey: "endTime",
        header: "End Time",
        cell: ({ row }: { row: { original: Appointment } }) => (
          <div>
            {format(new Date(row.original.endTime), "dd/MM/yyyy HH:mm")}
          </div>
        ),
      },
      {
        accessorKey: "duration",
        header: "Duration",
        meta: {
          className: "text-center w-40",
        } as CustomColumnMeta<Appointment, unknown>, // Type assertion
        cell: ({ row }: { row: { original: Appointment } }) => (
          <div className="text-center">{row.original.duration}</div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        meta: {
          className: "w-40",
        } as CustomColumnMeta<Appointment, unknown>, // Type assertion
        cell: ({ row }: { row: { original: Appointment } }) => (
          <div
            className={`text-center ${
              row.original.status === "completed"
                ? "bg-green-100 text-green-800"
                : row.original.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : row.original.status === "scheduled"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
            } rounded-md px-2 py-1`}
          >
            {row.original.status
              ? row.original.status.charAt(0).toUpperCase() +
                row.original.status.slice(1)
              : ""}
          </div>
        ),
      },
    ] as ColumnDef<Appointment, unknown>[], // Explicitly type columns
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
            placeholder="Search..."
            value={search}
            onChange={(event) => {
              const newSearch = event.target.value;
              setSearch(newSearch);
              setPage(1);
            }}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select
                value={status || "all"}
                onValueChange={(value) => {
                  setStatus(value === "all" ? "" : value);
                  setPage(1);
                  updateQueryParams({
                    status: value === "all" ? "" : value,
                    page: 1,
                  });
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                    <TableHead
                      key={header.id}
                      className={
                        (
                          header.column.columnDef.meta as CustomColumnMeta<
                            Appointment,
                            unknown
                          >
                        )?.className || ""
                      }
                    >
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
                        <TableCell
                          key={cell.id}
                          className={
                            (
                              cell.column.columnDef.meta as CustomColumnMeta<
                                Appointment,
                                unknown
                              >
                            )?.className || ""
                          }
                        >
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
                      colSpan={table.getAllColumns().length}
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
    </>
  );
}
