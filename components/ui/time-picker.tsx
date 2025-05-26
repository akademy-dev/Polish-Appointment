"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface TimePickerProps
  extends Omit<React.ComponentProps<typeof Button>, "value" | "onChange"> {
  id?: string;
  date: Date | undefined;
  setDate: (date: Date) => void;
}

const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(
  ({ date, setDate, className, id, ...props }, ref) => {
    const [currentHour, setCurrentHour] = useState<number>(
      date ? date.getHours() : 0
    );
    const [currentMinute, setCurrentMinute] = useState<number>(
      date ? date.getMinutes() : 0
    );

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (date) {
        setCurrentHour(date.getHours());
        setCurrentMinute(date.getMinutes());
      } else {
        setCurrentHour(0);
        setCurrentMinute(0);
      }
    }, [date]);

    const scrollToSelected = (
      containerRef: React.RefObject<HTMLDivElement | null>,
      value: number | undefined,
      dataAttribute: string
    ) => {
      if (value !== undefined && containerRef.current) {
        const selectedButton = containerRef.current.querySelector(
          `[data-${dataAttribute}="${value}"]`
        ) as HTMLElement;
        if (selectedButton) {
          // Check if popover is open before scrolling, or scroll on value change
          // For simplicity, scroll on value change, assuming popover is open or will open with this value.
          selectedButton.scrollIntoView({
            block: "center",
            behavior: "smooth",
          });
        }
      }
    };

    React.useEffect(() => {
      scrollToSelected(hourRef, currentHour, "hour");
    }, [currentHour]);

    React.useEffect(() => {
      scrollToSelected(minuteRef, currentMinute, "minute");
    }, [currentMinute]);

    const handleHourChange = (newHour: number) => {
      setCurrentHour(newHour);
      const newDate = date ? new Date(date.getTime()) : new Date();
      newDate.setHours(newHour);
      newDate.setMinutes(currentMinute);
      setDate(newDate);
    };

    const handleMinuteChange = (newMinute: number) => {
      setCurrentMinute(newMinute);
      const newDate = date ? new Date(date.getTime()) : new Date();
      newDate.setMinutes(newMinute);
      newDate.setHours(currentHour);
      setDate(newDate);
    };

    const hoursArray = Array.from({ length: 24 }, (_, i) => i);
    const minutesArray = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55

    const formatTime = (d: Date | undefined) => {
      if (!d) return "";
      const h = d.getHours();
      const m = d.getMinutes();
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-[120px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
            ref={ref}
            {...props}
          >
            <Clock className="mr-2 h-4 w-4" />
            {date ? formatTime(date) : <span>Pick a time</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="flex p-2 max-h-60">
            <div
              ref={hourRef}
              className="flex flex-col overflow-y-auto scrollbar-thin pr-1 mr-1 border-r"
            >
              {hoursArray.map((h) => (
                <Button
                  key={`hour-${h}`}
                  variant={currentHour === h ? "default" : "ghost"}
                  className="w-full justify-start px-2 py-1 h-auto text-sm"
                  onClick={() => handleHourChange(h)}
                  data-hour={h}
                >
                  {String(h).padStart(2, "0")}
                </Button>
              ))}
            </div>
            <div
              ref={minuteRef}
              className="flex flex-col overflow-y-auto scrollbar-thin pl-1 ml-1"
            >
              {minutesArray.map((m) => (
                <Button
                  key={`minute-${m}`}
                  variant={currentMinute === m ? "default" : "ghost"}
                  className="w-full justify-start px-2 py-1 h-auto text-sm"
                  onClick={() => handleMinuteChange(m)}
                  data-minute={m}
                >
                  {String(m).padStart(2, "0")}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
TimePicker.displayName = "TimePicker";

export { TimePicker };
