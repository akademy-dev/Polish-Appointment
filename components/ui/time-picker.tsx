"use client";

import * as React from "react";
import { ChevronDown, Clock } from "lucide-react";
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
    const [isOpen, setIsOpen] = useState(false);

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
          selectedButton.scrollIntoView({
            block: "center",
            behavior: "smooth",
          });
        }
      }
    };

    // Scroll when popover opens
    useEffect(() => {
      if (isOpen) {
        const timer = setTimeout(() => {
          scrollToSelected(hourRef, currentHour, "hour");
          scrollToSelected(minuteRef, currentMinute, "minute");
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [isOpen, currentHour, currentMinute]);

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
      <Popover onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-[120px] font-normal flex-between",
              !date && "text-muted-foreground",
              className
            )}
            ref={ref}
            {...props}
          >
            <Clock />
            {date ? formatTime(date) : <span>Pick a time</span>}
            <ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="flex p-2 max-h-60">
            <div
              ref={hourRef}
              className="flex flex-col overflow-y-auto pr-1 mr-1 border-r [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30"
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
              className="flex flex-col overflow-y-auto pl-1 ml-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30"
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
