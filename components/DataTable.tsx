"use client";
import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDuration } from "@/lib/utils";
import { Button } from "./ui/button";
import { ArrowUpDown, ArrowUpFromLine, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import * as React from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export type HistoryData = {
  service: string;
  customer: string;
  date: string;
  duration: number;
};

interface DataTableProps<TData, TValue> {
  title?: string; // Optional title prop
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  height?: string; // Optional height prop
  titleEmpty?: string; // Optional title for empty state
  searchColumn?: string; // Optional search column
  isShowPagination?: boolean; // Optional prop to show pagination
  getRowId?: (row: TData, index: number) => string; // <-- Add this line
  searchName?: string; // Optional search name
  isShowExport?: boolean; // Optional prop to show export button
  timezone?: string; // Optional timezone prop
}

export const columns: ColumnDef<HistoryData>[] = [
  {
    accessorKey: "service",
    header: "Service",
  },
  {
    accessorKey: "customer",
    header: "Customer",
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div>{formatDate(row.original.date)}</div>;
    },
  },
  {
    accessorKey: "duration",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Duration
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div>{formatDuration(row.original.duration)}</div>;
    },
  },
];

const DataTable = <TData, TValue>({
  title = "History",
  columns,
  data,
  height,
  titleEmpty,
  searchColumn = "customer",
  searchName = "Search",
  isShowPagination = true,
  getRowId,
  isShowExport = false,
  timezone = "",
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      "column-name-to-hide-by-default": false,
    });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    // show all data by default
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: data.length,
      },
    },
    getRowId,
  });

  const exportData = () => {
    // Helper to escape CSV values
    const escapeCSV = (value: unknown) => {
      if (value == null) return "";
      if (typeof value === "object" && "name" in value) {
        return String((value as { name: string }).name);
      }
      const str = String(value).replace(/"/g, '""');
      return /[",\n]/.test(str) ? `"${str}"` : str;
    };

    // Get visible columns in order
    const visibleColumns = table.getVisibleLeafColumns();

    // Get header row as plain text
    const headerRow = visibleColumns
      .map((col) =>
        typeof col.columnDef.header === "string"
          ? col.columnDef.header
          : col.id,
      )
      .map(escapeCSV)
      .join(",");

    // Get data rows
    const dataRows = table.getRowModel().rows.map((row) =>
      row
        .getVisibleCells()
        .map((cell, idx) => {
          // Check if this is the date column (first column)
          if (idx === 0 && timezone) {
            const dateValue = cell.getValue();
            if (dateValue) {
              try {
                const zone = format(
                  toZonedTime(new Date(dateValue as string), timezone),
                  "dd/MM/yyyy HH:mm",
                );
                return escapeCSV(zone);
              } catch {
                return escapeCSV(dateValue);
              }
            }
          }
          return escapeCSV(cell.getValue());
        })
        .join(","),
    );

    const csvContent = [headerRow, ...dataRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      <div className="flex-between py-4 gap-4">
        <Label htmlFor="history-search" className="text-right text-lg">
          {title}
        </Label>

        <div className="relative max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4 text-black" />
          </span>
          <Input
            id="history-search"
            placeholder={searchName}
            value={
              (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm pl-10 "
          />
        </div>
      </div>

      <div className="rounded-md border w-full flex-1 min-h-0">
        <div
          className="relative h-full overflow-auto [&::-webkit-scrollbar]:hidden scrollbar-hide"
          {...(height ? { style: { height } } : {})}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-secondary">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
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
                    {titleEmpty || "No data available"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {isShowPagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="default"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      )}
      <div className="flex justify-end mt-2" hidden={!isShowExport}>
        <Button
          onClick={() => exportData()}
          size={"lg"}
          className="flex items-center gap-1"
        >
          <ArrowUpFromLine className="w-4 h-4" />
          Export
        </Button>
      </div>
    </div>
  );
};

export default DataTable;
