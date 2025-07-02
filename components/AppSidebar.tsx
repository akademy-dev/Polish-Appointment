"use client";

import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Calendar } from "./ui/calendar";
import React, { useContext, useTransition } from "react";
import { CalendarContext } from "@/hooks/context";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

export function AppSidebar() {
  const { date, setDate, setIsLoading } = useContext(CalendarContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const numOfWeeklyJump = [1, 2, 3, 4];
  const [notWorking, setNotWorking] = React.useState(false);

  const handleNotWorkingChange = (checked: boolean) => {
    setNotWorking(checked);
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("notWorking", checked ? "true" : "false");
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    router.push(newUrl);
  };

  // Sync initial date with URL
  React.useEffect(() => {
    const dateFromUrl = searchParams.get("date");
    if (dateFromUrl && !isNaN(Date.parse(dateFromUrl))) {
      setDate(new Date(dateFromUrl));
    }
  }, [searchParams, setDate]);

  const handleNextWeek = (numberOfWeek: number) => {
    if (date) {
      const nextWeek = new Date(date);
      nextWeek.setDate(nextWeek.getDate() + numberOfWeek * 7);
      handleDateChange(nextWeek);
    }
  };

  const handlePreviousWeek = (numberOfWeek: number) => {
    if (date) {
      const previousWeek = new Date(date);
      previousWeek.setDate(previousWeek.getDate() - numberOfWeek * 7);
      handleDateChange(previousWeek);
    }
  };

  const handleDateChange = (newDate: Date) => {
    setIsLoading(true); // Set loading immediately
    startTransition(() => {
      setDate(newDate);
      const currentParams = new URLSearchParams(window.location.search);
      const formattedDate = format(newDate, "yyyy-MM-dd");
      currentParams.set("date", formattedDate);
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      router.push(newUrl);
    });
  };

  return (
    <Sidebar>
      <SidebarContent className="px-4 py-4">
        <span className="text-m font-bold">Calendar</span>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            if (newDate) {
              handleDateChange(newDate);
            }
          }}
          month={date}
          onMonthChange={(newMonth) => {
            if (newMonth) {
              handleDateChange(newMonth);
            }
          }}
          className="rounded-md border"
          required={false}
        />
        <div className="flex justify-between items-center">
          <span className="text-m font-bold mt-2">Navigation</span>
          <Button
            onClick={() => {
              const today = new Date();
              handleDateChange(today);
            }}
          >
            Today
          </Button>
        </div>

        <span className="text-xs">Weekly jump</span>
        <div className="flex space-x-1">
          {numOfWeeklyJump.map((week) => (
            <Button
              key={week}
              variant="outline"
              size="sm"
              onClick={() => handlePreviousWeek(week)}
            >
              -{week}
            </Button>
          ))}
        </div>
        <div className="flex space-x-1">
          {numOfWeeklyJump.map((week) => (
            <Button
              key={week}
              variant="outline"
              size="sm"
              onClick={() => handleNextWeek(week)}
            >
              +{week}
            </Button>
          ))}
        </div>
        <span className="text-m font-bold mt-2">View options</span>
        <div className="flex flex-col gap-4 mt-2">
          <div
            className="flex items-center space-x-2"
            onClick={() => handleNotWorkingChange(!notWorking)}
          >
            <Checkbox id="not-working" checked={notWorking} />
            <label
              htmlFor="not-working"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Not working
            </label>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
