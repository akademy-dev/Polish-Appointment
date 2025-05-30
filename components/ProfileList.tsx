"use client";
import React, { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Profile } from "@/types/profile";
import ProfileCard from "./ProfileCard";

const ProfileList = ({ data }: { data: Profile[] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const generatePageNumbers = () => {
    // Always return exactly 7 slots for consistent layout
    const slots: (number | "ellipsis" | null)[] = [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ];

    if (totalPages <= 7) {
      // For 7 or fewer pages, center the pages in the grid
      const startIndex = Math.floor((7 - totalPages) / 2);
      for (let i = 1; i <= totalPages; i++) {
        slots[startIndex + i - 1] = i;
      }
      return slots;
    }

    // For more than 5 pages, use smart positioning - ALWAYS FILL ALL 7 SLOTS
    if (currentPage <= 3) {
      // Early pages: 1, 2, 3, 4, 5, ..., last
      slots[0] = 1;
      slots[1] = 2;
      slots[2] = 3;
      slots[3] = 4;
      slots[4] = 5;
      slots[5] = "ellipsis";
      slots[6] = totalPages;
    } else if (currentPage >= totalPages - 2) {
      // Late pages: 1, ..., last-4, last-3, last-2, last-1, last
      slots[0] = 1;
      slots[1] = "ellipsis";
      slots[2] = totalPages - 4;
      slots[3] = totalPages - 3;
      slots[4] = totalPages - 2;
      slots[5] = totalPages - 1;
      slots[6] = totalPages;
    } else {
      // Middle pages: 1, ..., current-1, current, current+1, ..., last
      slots[0] = 1;
      slots[1] = "ellipsis";
      slots[2] = currentPage - 1;
      slots[3] = currentPage;
      slots[4] = currentPage + 1;
      slots[5] = "ellipsis";
      slots[6] = totalPages;
    }

    return slots;
  };

  return (
    <section className="space-y-6 max-w-4xl">
      {/* Results Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
          <span className="font-medium">{Math.min(endIndex, data.length)}</span>{" "}
          of <span className="font-medium">{data.length}</span> people
        </p>

        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </div>
      </div>

      {/* Human List */}
      <ul className="list-container">
        {currentItems.map((profile) => (
          <ProfileCard profile={profile} key={profile.id} />
        ))}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="flex w-full pr-4 sm:justify-end">
          <PaginationContent>
            {/* Previous Button */}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {/* Page Numbers */}
            <div className="grid grid-cols-7 gap-1">
              {generatePageNumbers().map((slot, index) => (
                <div key={index} className="flex-between">
                  {slot === null ? (
                    <div className="w-9 h-9" />
                  ) : slot === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(slot as number);
                      }}
                      isActive={currentPage === slot}
                      className="cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                      {slot}
                    </PaginationLink>
                  )}
                </div>
              ))}
            </div>

            {/* Next Button */}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
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
    </section>
  );
};

export default ProfileList;
