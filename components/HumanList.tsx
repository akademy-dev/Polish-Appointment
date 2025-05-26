"use client";
import React, { useState } from "react";
import HumanCard from "./HumanCard";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export interface Human {
  id: number;
  name: string;
  position: string;
  // timeSchedule: TimeSchedule[];
}

const HumanList = () => {
  const humans: Human[] = [
    {
      id: 1,
      name: "Alice Johnson",
      position: "Manager",
    },
    {
      id: 2,
      name: "Bob Smith",
      position: "Developer",
    },
    {
      id: 3,
      name: "Charlie Brown",
      position: "Designer",
    },
    {
      id: 4,
      name: "David Wilson",
      position: "Developer",
    },
    {
      id: 5,
      name: "Eve Davis",
      position: "Developer",
    },
    {
      id: 6,
      name: "Frank Miller",
      position: "QA Engineer",
    },
    {
      id: 7,
      name: "Grace Lee",
      position: "Product Manager",
    },
    {
      id: 8,
      name: "Henry Taylor",
      position: "DevOps Engineer",
    },
    {
      id: 9,
      name: "Ivy Chen",
      position: "UI/UX Designer",
    },
    {
      id: 10,
      name: "Jack Anderson",
      position: "Backend Developer",
    },
    {
      id: 11,
      name: "Kate Thompson",
      position: "Frontend Developer",
    },
    {
      id: 12,
      name: "Liam Garcia",
      position: "Data Analyst",
    },
    {
      id: 13,
      name: "Maya Rodriguez",
      position: "Marketing Specialist",
    },
    {
      id: 14,
      name: "Noah Martinez",
      position: "Sales Representative",
    },
    {
      id: 15,
      name: "Olivia White",
      position: "HR Manager",
    },
    {
      id: 16,
      name: "Paul Jackson",
      position: "Finance Manager",
    },
    {
      id: 17,
      name: "Quinn Lewis",
      position: "Operations Manager",
    },
    {
      id: 18,
      name: "Rachel Clark",
      position: "Customer Support",
    },
    {
      id: 19,
      name: "Samantha Adams",
      position: "Software Engineer",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(humans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = humans.slice(startIndex, endIndex);

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
          <span className="font-medium">
            {Math.min(endIndex, humans.length)}
          </span>{" "}
          of <span className="font-medium">{humans.length}</span> people
        </p>

        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </div>
      </div>

      {/* Human List */}
      <ul className="list-container">
        {currentItems.map((human: Human) => (
          <HumanCard human={human} key={human.id} />
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

export default HumanList;
