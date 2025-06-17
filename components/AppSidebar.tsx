"use client";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Calendar } from "./ui/calendar";
import React from "react";
import { useContext } from "react";
import { CalendarContext } from "@/hooks/context";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { useRouter } from "next/navigation";

export function AppSidebar() {
  const { date, setDate } = useContext(CalendarContext);
  const numOfWeeklyJump = [1, 2, 3, 4];

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

  const router = useRouter();

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    const localDate = new Date(
      newDate.getTime() - newDate.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("date", localDate);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    router.push(newUrl);
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
              handleDateChange(newDate); // Pass Date object
            }
          }}
          month={date}
          onMonthChange={(newMonth) => setDate(newMonth)}
          className="rounded-md border"
          required={false}
        />
        <div className="flex flex-between">
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
          <div className="flex items-center space-x-2">
            <Checkbox id="cancelled" />
            <label
              htmlFor="cancelled"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Appointment Cancelled
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="time-off" />
            <label
              htmlFor="time-off"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Time-off staffs
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="cancelled-time-off" />
            <label
              htmlFor="cancelled-time-off"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Cancelled Time Off
            </label>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
