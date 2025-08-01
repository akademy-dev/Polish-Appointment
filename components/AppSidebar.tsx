"use client";

import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Calendar } from "./ui/calendar";
import React, { useContext, useTransition, useEffect } from "react";
import { CalendarContext } from "@/hooks/context";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { useRouter, useSearchParams } from "next/navigation";
import { getIanaTimezone } from "@/lib/utils";
import moment from "moment-timezone";

export function AppSidebar() {
  const { date, setDate, setIsLoading, timezone } = useContext(CalendarContext);
  moment.tz.setDefault(getIanaTimezone(timezone));

  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const numOfWeeklyJump = [1, 2, 3, 4];
  const [notWorking, setNotWorking] = React.useState(false);
  const [cancelled, setCancelled] = React.useState(false);

  // Hàm helper để convert real date (UTC-based) sang display date (fake local cho Calendar)
  const toDisplayDate = (realDate: Date) => {
    const m = moment(realDate).tz(getIanaTimezone(timezone));
    return new Date(m.year(), m.month(), m.date());
  };

  // Hàm helper để convert display date (từ Calendar) sang real date (UTC-based theo timezone)
  const fromDisplayDate = (displayDate: Date) => {
    const year = displayDate.getFullYear();
    const month = (displayDate.getMonth() + 1).toString().padStart(2, "0");
    const day = displayDate.getDate().toString().padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return moment.tz(dateStr, getIanaTimezone(timezone)).toDate();
  };

  // Hàm chung để cập nhật URL params
  const updateUrlParams = (updates: Record<string, string | boolean>) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      currentParams.set(key, value.toString());
    });
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    router.push(newUrl);
  };

  const handleNotWorkingChange = (checked: boolean) => {
    setNotWorking(checked);
    updateUrlParams({ notWorking: checked });
  };

  const handleCancelledChange = (checked: boolean) => {
    setCancelled(checked);
    updateUrlParams({ cancelled: checked });
  };

  // Sync initial date with URL, và đồng bộ notWorking/cancelled nếu cần
  useEffect(() => {
    const dateFromUrl = searchParams.get("date");
    if (dateFromUrl) {
      const parsedDate = moment
        .tz(dateFromUrl, "YYYY-MM-DD", getIanaTimezone(timezone))
        .toDate();
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
      }
    }
    // Đồng bộ checkbox từ URL (nếu có)
    setNotWorking(searchParams.get("notWorking") === "true");
    setCancelled(searchParams.get("cancelled") === "true");
  }, [searchParams, timezone, setDate]);

  const handleNextWeek = (numberOfWeek: number) => {
    if (date) {
      const nextWeek = moment(date).add(numberOfWeek, "weeks").toDate();
      handleDateChange(nextWeek);
    }
  };

  const handlePreviousWeek = (numberOfWeek: number) => {
    if (date) {
      const previousWeek = moment(date)
        .subtract(numberOfWeek, "weeks")
        .toDate();
      handleDateChange(previousWeek);
    }
  };

  const handleDateChange = (newDate: Date) => {
    setIsLoading(true);
    startTransition(() => {
      setDate(newDate);
      updateUrlParams({ date: moment(newDate).format("YYYY-MM-DD") });
      setIsLoading(false); // Reset loading sau transition
    });
  };

  return (
    <Sidebar>
      <SidebarContent className="px-4 py-4">
        <span className="text-m font-bold">Calendar</span>
        <Calendar
          mode="single"
          today={toDisplayDate(new Date())} // Display today theo timezone
          selected={toDisplayDate(date)} // Display selected theo timezone
          onSelect={(newDate) => {
            if (newDate) {
              const adjustedDate = fromDisplayDate(newDate);
              handleDateChange(adjustedDate);
            }
          }}
          month={toDisplayDate(date)} // Display month theo timezone
          onMonthChange={(newMonth) => {
            if (newMonth) {
              const adjustedMonth = fromDisplayDate(newMonth);
              handleDateChange(adjustedMonth);
            }
          }}
          className="rounded-md border"
          required={false}
        />
        <div className="flex justify-between items-center">
          <span className="text-m font-bold mt-2">Navigation</span>
          <Button
            onClick={() => {
              const today = moment
                .tz(new Date(), getIanaTimezone(timezone))
                .toDate();
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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="not-working"
              checked={notWorking}
              onCheckedChange={handleNotWorkingChange}
            />
            <label
              htmlFor="not-working"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Not working
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cancelled"
              checked={cancelled}
              onCheckedChange={handleCancelledChange}
            />
            <label
              htmlFor="cancelled"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Cancelled
            </label>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
