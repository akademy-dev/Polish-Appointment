"use client";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import TimeScheduleCard, { TimeScheduleCardProps } from "./TimeScheduleCard";
import TimeScheduleForm from "./TimeScheduleForm";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import SelectTime from "./SelectTime";

const dateLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CreateInfoButton = ({ type }: { type: string }) => {
  const [fromTime, setFromTime] = useState(new Date());
  const [toTime, setToTime] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [timeScheduleCardData, setTimeScheduleCardData] = useState<
    TimeScheduleCardProps[]
  >([
    { id: "1", date: "Every Day", time: "", reason: "Sick" },
    {
      id: "2",
      date: "Every Wednesday",
      time: "",
      reason: "One day a week off",
    },
    {
      id: "3",
      date: "May 20, 2025",
      time: "10:00 - 12:00",
      reason: "Birthday",
    },
    { id: "4", date: "Day 03 Every Month", time: "", reason: "Public Holiday" },
    { id: "5", date: "March Every Year", time: "", reason: "Sabbath" },
  ]);

  const handleAddTimeScheduleCard = () => {
    setTimeScheduleCardData([
      { id: Date.now().toString(), date: "", time: "", reason: "" },
      ...timeScheduleCardData,
    ]);

    // Use setTimeout to ensure the new element is rendered before scrolling
    setTimeout(() => {
      const scrollContainer = scrollContainerRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 0);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="default" className="sm:whitespace-nowrap">
          {type === "employees" ? "New Employee" : "New Customer"}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        closeButton={false}
        className="sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            New {type === "employees" ? "Employee" : "Customer"}
          </SheetTitle>
        </SheetHeader>

        <form className="grid gap-4 p-4">
          <div className="grid-center grid-cols-5 gap-4">
            <Input
              id="name"
              value=""
              placeholder="Full name"
              className="col-span-3"
            />
            <Select>
              <SelectTrigger className="col-span-1">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Manager</SelectItem>
                <SelectItem value="dark">Employee</SelectItem>
                <SelectItem value="system">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid-center">
            <p className="text-xl-semibold">Working time</p>
          </div>

          <div className="grid-center grid-rows-2 gap-4">
            <div className="row-span-1 flex gap-4">
              <SelectTime label="From" date={fromTime} setDate={setFromTime} />
              <SelectTime label="To" date={toTime} setDate={setToTime} />
            </div>
            <div className="row-span-1 flex-between">
              {dateLabels.map((label) => (
                <div key={label} className="flex-between gap-1 ">
                  <Checkbox id={label} />
                  <Label htmlFor={label}>{label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-center grid-cols-3 gap-4">
            <p className="col-span-2 text-xl-semibold">Time-off schedule</p>
            <Button
              variant="outline"
              className="col-span-1"
              onClick={(e) => {
                e.preventDefault();
                handleAddTimeScheduleCard();
              }}
            >
              Add new entry
            </Button>
          </div>

          <ScrollArea
            ref={scrollContainerRef}
            className="h-37 rounded-md border"
          >
            {timeScheduleCardData.map((card) => (
              <TimeScheduleCard
                key={card.id}
                {...card}
                onRemove={() => {
                  setTimeScheduleCardData(
                    timeScheduleCardData.filter((c) => c.id !== card.id)
                  );
                }}
              />
            ))}
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          <div className="grid rounded-md border">
            <TimeScheduleForm />
          </div>
        </form>

        <SheetFooter>
          <SheetClose asChild>
            <div className="flex-between">
              <Button type="submit" variant="destructive">
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CreateInfoButton;
