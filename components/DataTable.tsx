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
import { ArrowUpDown, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import * as React from "react";

export const historyData: HistoryData[] = [
  {
    service: "Service 1",
    customer: "Customer 1",
    date: new Date().toISOString(),
    duration: 60,
  },
  {
    service: "Service 2",
    customer: "Customer 2",
    date: new Date().toISOString(),
    duration: 120,
  },
  {
    service: "Service 3",
    customer: "Customer 3",
    date: new Date().toISOString(),
    duration: 15,
  },
  {
    service: "Service 4",
    customer: "Customer 4",
    date: new Date().toISOString(),
    duration: 20,
  },
];

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
  isShowPagination = true,
  getRowId,
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
    },
    // show all data by default
    initialState: {
      pagination: {
        pageSize: data.length,
      },
    },
    getRowId,
  });
  return (
    <>
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
            placeholder="Search"
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
      <div className="rounded-md border">
        <div
          className="relative overflow-auto [&::-webkit-scrollbar]:hidden scrollbar-hide"
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
    </>
  );
};

export default DataTable;
