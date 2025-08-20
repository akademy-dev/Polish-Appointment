"use client";
import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Profile, getProfileId } from "@/models/profile";
import ProfileCard from "./ProfileCard";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

const ProfileList = ({
  data,
  totalItems,
  itemsPerPage,
}: {
  data: Profile[];
  totalItems: number;
  itemsPerPage: number;
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndexDisplay = (currentPage - 1) * itemsPerPage;
  const currentItemsCount = data.length;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pageNumber));
    return `${pathname}?${params.toString()}`;
  };

  const handleItemsPerPageChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", value);
    params.set("page", "1"); // Reset to first page when changing items per page
    router.push(`${pathname}?${params.toString()}`);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href={createPageURL(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink href={createPageURL(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>,
      );

      // Show ellipsis if current page is not near start
      if (currentPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }

      // Show current page and one page before and after
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href={createPageURL(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }

      // Show ellipsis if current page is not near end
      if (currentPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }

      // Always show last page
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href={createPageURL(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <section className="space-y-6 max-w-4xl">
      {totalItems === 0 ? (
        <p className="text-center text-lg-medium">No results found</p>
      ) : (
        <>
          {/* Results Info and Items Per Page Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pr-4">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">{startIndexDisplay + 1}</span> to{" "}
              <span className="font-medium">
                {startIndexDisplay + currentItemsCount}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> people
            </p>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Page <span className="font-medium">{currentPage}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </div>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={handleItemsPerPageChange}
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

          {/* Human List */}
          <ul className="list-container">
            {data.map((profile) => (
              <ProfileCard profile={profile} key={getProfileId(profile)} />
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="flex w-full pr-4 sm:justify-end">
              <PaginationContent>
                {/* Previous Button */}
                <PaginationItem>
                  <PaginationPrevious
                    href={createPageURL(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {/* Page Numbers */}
                <div className="grid grid-cols-7 gap-1">
                  {renderPaginationItems().map((item, index) => (
                    <div key={index} className="flex-between">
                      {item}
                    </div>
                  ))}
                </div>

                {/* Next Button */}
                <PaginationItem>
                  <PaginationNext
                    href={createPageURL(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </section>
  );
};

export default ProfileList;
